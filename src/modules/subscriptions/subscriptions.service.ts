import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import {
  PurchaseRecord,
  PurchaseRecordDocument,
  PurchaseProduct,
  PurchaseSource,
} from './schemas/purchase-record.schema';
import { UnlockCode, UnlockCodeDocument } from './schemas/unlock-code.schema';
import { MonthCycle, MonthCycleDocument } from './schemas/month-cycle.schema';

// 6-character codes from an unambiguous alphabet (no 0/O/1/I/L) so users
// don't second-guess what they're typing.
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(PurchaseRecord.name) private purchases: Model<PurchaseRecordDocument>,
    @InjectModel(UnlockCode.name) private codes: Model<UnlockCodeDocument>,
    @InjectModel(MonthCycle.name) private cycles: Model<MonthCycleDocument>,
  ) {}

  // --- Purchases -----------------------------------------------------------

  async recordPurchase(args: {
    userId: string;
    product: PurchaseProduct;
    source: PurchaseSource;
    transactionId: string;
    amountDisplay?: string;
    currency?: string;
    metadata?: Record<string, any>;
  }): Promise<PurchaseRecordDocument> {
    // Idempotent on transactionId so a flaky network retry from the
    // mobile client doesn't double-record a purchase.
    const existing = await this.purchases.findOne({ transactionId: args.transactionId });
    if (existing) return existing;
    return this.purchases.create({
      userId: new Types.ObjectId(args.userId),
      product: args.product,
      source: args.source,
      transactionId: args.transactionId,
      amountDisplay: args.amountDisplay,
      currency: args.currency,
      metadata: args.metadata,
      status: 'active',
    });
  }

  // Apple receipt verification. Sends the base-64 receipt to Apple's
  // verifyReceipt endpoint (sandbox first, falls back to production
  // if Apple says we hit the wrong env).
  async verifyAppleReceipt(receiptB64: string): Promise<{ valid: boolean; transactionId?: string; productId?: string; raw?: any }> {
    const sharedSecret = process.env.APPLE_IAP_SHARED_SECRET || '';
    const verify = async (url: string) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receiptB64,
          password: sharedSecret,
          'exclude-old-transactions': true,
        }),
      });
      return (await res.json()) as any;
    };

    let body = await verify('https://buy.itunes.apple.com/verifyReceipt');
    if (body?.status === 21007) {
      // Apple says "this is a sandbox receipt" — retry against the sandbox URL.
      body = await verify('https://sandbox.itunes.apple.com/verifyReceipt');
    }

    if (body?.status !== 0) {
      return { valid: false, raw: body };
    }
    const latest = body?.latest_receipt_info?.[0] || body?.receipt?.in_app?.[0];
    return {
      valid: true,
      transactionId: latest?.transaction_id,
      productId: latest?.product_id,
      raw: body,
    };
  }

  // Google Play receipt verification. Calls the Android Publisher API
  // directly using a service-account access token (set GOOGLE_PLAY_*
  // env vars). For simplicity v1 only verifies the purchaseToken is
  // accepted — full subscription state checking is the next iteration.
  async verifyGooglePurchase(args: {
    productId: string;
    purchaseToken: string;
  }): Promise<{ valid: boolean; transactionId?: string; raw?: any }> {
    const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || '';
    const accessToken = process.env.GOOGLE_PLAY_ACCESS_TOKEN || '';
    if (!packageName || !accessToken) {
      // Not configured yet — accept the receipt as-is and trust the
      // mobile-reported productId so end-to-end works in dev. In
      // production these env vars MUST be set.
      return { valid: true, transactionId: args.purchaseToken };
    }
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${args.productId}/tokens/${args.purchaseToken}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      return { valid: false };
    }
    const body = (await res.json()) as any;
    // purchaseState 0 = purchased, 1 = cancelled, 2 = pending
    return {
      valid: body?.purchaseState === 0,
      transactionId: body?.orderId || args.purchaseToken,
      raw: body,
    };
  }

  async hasActivePurchase(userId: string, product: PurchaseProduct): Promise<boolean> {
    const found = await this.purchases.findOne({
      userId: new Types.ObjectId(userId),
      product,
      status: 'active',
    });
    return !!found;
  }

  // True if the user can access 30-day program content. Both products
  // grant access: '30-day-recharge' (IAP) and 'all-in' (code redemption,
  // since All-In bundles the 30-day program plus the consultation).
  async hasActiveProgramAccess(userId: string): Promise<boolean> {
    const found = await this.purchases.findOne({
      userId: new Types.ObjectId(userId),
      product: { $in: ['30-day-recharge', 'all-in'] },
      status: 'active',
    });
    return !!found;
  }

  async listPurchases(userId: string): Promise<PurchaseRecordDocument[]> {
    return this.purchases
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  // --- Unlock codes --------------------------------------------------------

  private generateCode(): string {
    const buf = randomBytes(6);
    let out = '';
    for (let i = 0; i < 6; i++) {
      out += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length];
    }
    return out;
  }

  async generateCodes(args: {
    count: number;
    createdBy: string;
    notes?: string;
    expiresAt?: Date;
    product?: 'all-in' | '30-day-recharge';
  }): Promise<UnlockCodeDocument[]> {
    const created: UnlockCodeDocument[] = [];
    let attempts = 0;
    while (created.length < args.count && attempts < args.count * 5) {
      attempts++;
      const code = this.generateCode();
      try {
        const doc = await this.codes.create({
          code,
          product: args.product ?? 'all-in',
          status: 'unused',
          createdBy: new Types.ObjectId(args.createdBy),
          notes: args.notes,
          expiresAt: args.expiresAt,
        });
        created.push(doc);
      } catch (err: any) {
        // Mongo duplicate-key (extremely rare with this alphabet) — retry
        if (err?.code !== 11000) throw err;
      }
    }
    return created;
  }

  async listCodes(filter?: 'unused' | 'redeemed' | 'revoked' | 'all') {
    const query: any = {};
    if (filter && filter !== 'all') query.status = filter;
    return this.codes
      .find(query)
      .sort({ createdAt: -1 })
      .populate('redeemedBy', 'email name')
      .populate('createdBy', 'email name');
  }

  async revokeCode(id: string): Promise<void> {
    const updated = await this.codes.findByIdAndUpdate(id, { status: 'revoked' }, { new: true });
    if (!updated) throw new NotFoundException('Code not found');
  }

  async redeemCode(args: { userId: string; code: string }): Promise<UnlockCodeDocument> {
    const normalised = args.code.trim().toUpperCase();
    const doc = await this.codes.findOne({ code: normalised });
    if (!doc) throw new NotFoundException('Code not found');
    if (doc.status === 'redeemed') throw new BadRequestException('Code already redeemed');
    if (doc.status === 'revoked') throw new BadRequestException('Code has been revoked');
    if (doc.expiresAt && doc.expiresAt < new Date()) {
      throw new BadRequestException('Code has expired');
    }

    doc.status = 'redeemed';
    doc.redeemedBy = new Types.ObjectId(args.userId);
    doc.redeemedAt = new Date();
    await doc.save();

    await this.recordPurchase({
      userId: args.userId,
      product: doc.product,
      source: 'code-redemption',
      transactionId: `code:${doc._id}`,
      metadata: { codeId: doc._id, code: doc.code },
    });

    return doc;
  }

  // --- Month cycles --------------------------------------------------------

  async startNewCycle(userId: string, monthNumber: number): Promise<MonthCycleDocument> {
    // Mark any existing active cycle as inactive so only one is active at a time.
    await this.cycles.updateMany(
      { userId: new Types.ObjectId(userId), isActive: true },
      { $set: { isActive: false } },
    );
    return this.cycles.create({
      userId: new Types.ObjectId(userId),
      monthNumber,
      isActive: true,
      startedAt: new Date(),
    });
  }

  async completeCurrentCycle(userId: string): Promise<void> {
    await this.cycles.updateOne(
      { userId: new Types.ObjectId(userId), isActive: true },
      { $set: { completedAt: new Date(), completedDays: 30, completionPercentage: 100 } },
    );
  }

  async listCycles(userId: string): Promise<MonthCycleDocument[]> {
    return this.cycles
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ monthNumber: -1 });
  }
}
