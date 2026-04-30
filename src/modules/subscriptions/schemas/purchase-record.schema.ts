import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PurchaseRecordDocument = PurchaseRecord & Document;

export type PurchaseProduct = '30-day-recharge' | 'all-in';
export type PurchaseSource = 'apple-iap' | 'google-iap' | 'code-redemption' | 'admin-grant';

@Schema({ timestamps: true })
export class PurchaseRecord {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: ['30-day-recharge', 'all-in'] })
  product: PurchaseProduct;

  @Prop({ type: String, required: true, enum: ['apple-iap', 'google-iap', 'code-redemption', 'admin-grant'] })
  source: PurchaseSource;

  // Apple/Google receipt id, redemption code, or admin user id depending on source
  @Prop({ required: true })
  transactionId: string;

  @Prop()
  amountDisplay?: string; // e.g. "$55.00" or "₹999"

  @Prop()
  currency?: string; // e.g. "USD", "INR"

  @Prop({ type: Object })
  metadata?: Record<string, any>; // raw receipt payload, redemption code id, etc.

  @Prop({ type: String, default: 'active', enum: ['active', 'refunded', 'revoked'] })
  status: 'active' | 'refunded' | 'revoked';
}

export const PurchaseRecordSchema = SchemaFactory.createForClass(PurchaseRecord);
PurchaseRecordSchema.index({ userId: 1, product: 1 });
PurchaseRecordSchema.index({ transactionId: 1 }, { unique: true });
