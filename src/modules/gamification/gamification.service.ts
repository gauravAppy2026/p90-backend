import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  GamificationRule,
  GamificationRuleDocument,
  RULE_KEYS,
  RuleKey,
} from './schemas/gamification-rule.schema';
import {
  RedemptionOption,
  RedemptionOptionDocument,
} from './schemas/redemption-option.schema';
import { Redemption, RedemptionDocument } from './schemas/redemption.schema';
import {
  TokenLedger,
  TokenLedgerDocument,
} from './schemas/token-ledger.schema';
import {
  UserProgress,
  UserProgressDocument,
} from '../program/schemas/user-progress.schema';

// Default token rates seeded on first boot if no rules exist yet.
// Admins can edit afterwards via the admin endpoints.
const DEFAULT_RULES: Array<{ key: RuleKey; tokens: number; description: string }> = [
  { key: 'lesson_complete', tokens: 10, description: 'Complete a daily lesson' },
  { key: 'checklist_all_done', tokens: 5, description: 'Complete all daily checklist items' },
  { key: 'tracker_entry', tokens: 5, description: 'Save a daily tracker entry' },
  { key: 'progress_photo', tokens: 10, description: 'Upload a progress photo' },
  { key: 'streak_7_day', tokens: 50, description: '7-day streak bonus' },
  { key: 'streak_14_day', tokens: 100, description: '14-day streak bonus' },
  { key: 'streak_30_day', tokens: 200, description: '30-day streak bonus' },
  { key: 'program_complete', tokens: 300, description: 'Complete the 30-day program' },
];

const DEFAULT_REDEMPTIONS = [
  {
    title: '$10 Donation to The Living Food Mission',
    description: 'Convert your tokens into a charitable donation.',
    tokenCost: 500,
    kind: 'charity' as const,
    payload: { amountUsd: 10 },
    order: 1,
  },
  {
    title: '$25 Donation to The Living Food Mission',
    tokenCost: 1000,
    kind: 'charity' as const,
    payload: { amountUsd: 25 },
    order: 2,
  },
  {
    title: '10% off retreat booking',
    description: 'Stacks with your 30-day-completion retreat discount.',
    tokenCost: 1500,
    kind: 'retreat-discount' as const,
    payload: { percent: 10 },
    order: 3,
  },
  {
    title: '20% off retreat booking',
    tokenCost: 2500,
    kind: 'retreat-discount' as const,
    payload: { percent: 20 },
    order: 4,
  },
];

@Injectable()
export class GamificationService implements OnModuleInit {
  constructor(
    @InjectModel(GamificationRule.name) private rules: Model<GamificationRuleDocument>,
    @InjectModel(RedemptionOption.name) private options: Model<RedemptionOptionDocument>,
    @InjectModel(Redemption.name) private redemptions: Model<RedemptionDocument>,
    @InjectModel(TokenLedger.name) private ledger: Model<TokenLedgerDocument>,
    @InjectModel(UserProgress.name) private progress: Model<UserProgressDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultsIfEmpty();
  }

  private async seedDefaultsIfEmpty() {
    const ruleCount = await this.rules.countDocuments();
    if (ruleCount === 0) {
      await this.rules.insertMany(
        DEFAULT_RULES.map((r) => ({ ...r, isActive: true })),
      );
    }
    const optionCount = await this.options.countDocuments();
    if (optionCount === 0) {
      await this.options.insertMany(
        DEFAULT_REDEMPTIONS.map((o) => ({ ...o, isActive: true })),
      );
    }
  }

  // --- Rules (admin) -------------------------------------------------------

  async listRules() {
    return this.rules.find().sort({ key: 1 });
  }

  async updateRule(key: RuleKey, data: Partial<{ tokens: number; description: string; isActive: boolean }>) {
    if (!RULE_KEYS.includes(key)) {
      throw new BadRequestException('Unknown rule key');
    }
    const updated = await this.rules.findOneAndUpdate({ key }, data, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
    return updated;
  }

  async getRuleTokens(key: RuleKey): Promise<number> {
    const rule = await this.rules.findOne({ key, isActive: true });
    return rule?.tokens ?? 0;
  }

  // --- Redemption options (admin) -----------------------------------------

  async listOptions(activeOnly = false) {
    const query: any = {};
    if (activeOnly) query.isActive = true;
    return this.options.find(query).sort({ order: 1, tokenCost: 1 });
  }

  async createOption(data: any) {
    return this.options.create({ ...data, isActive: data.isActive ?? true });
  }

  async updateOption(id: string, data: any) {
    const updated = await this.options.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new NotFoundException('Option not found');
    return updated;
  }

  async deleteOption(id: string) {
    const deleted = await this.options.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Option not found');
  }

  // --- Token earn (server-side) -------------------------------------------

  // Called by other modules (program, tracker, checklist) after a qualifying
  // action. Idempotency is the caller's responsibility — callers pass a
  // unique referenceId so the same action can't be double-counted.
  async award(args: {
    userId: string;
    key: RuleKey;
    referenceId?: string;
    monthCycle?: number;
  }): Promise<{ awarded: number; balance: number }> {
    const tokens = await this.getRuleTokens(args.key);
    if (tokens <= 0) return { awarded: 0, balance: await this.getBalance(args.userId) };

    if (args.referenceId) {
      const existing = await this.ledger.findOne({
        userId: new Types.ObjectId(args.userId),
        reason: args.key,
        referenceId: args.referenceId,
      });
      if (existing) {
        return { awarded: 0, balance: await this.getBalance(args.userId) };
      }
    }

    const newBalance = await this.applyDelta(args.userId, tokens);
    await this.ledger.create({
      userId: new Types.ObjectId(args.userId),
      delta: tokens,
      reason: args.key,
      referenceId: args.referenceId,
      balanceAfter: newBalance,
      monthCycle: args.monthCycle,
    });
    return { awarded: tokens, balance: newBalance };
  }

  // --- Redemption (user-facing) -------------------------------------------

  async redeem(args: { userId: string; optionId: string }) {
    const option = await this.options.findById(args.optionId);
    if (!option || !option.isActive) throw new NotFoundException('Option not available');

    const balance = await this.getBalance(args.userId);
    if (balance < option.tokenCost) {
      throw new BadRequestException(`Not enough tokens. You have ${balance}, need ${option.tokenCost}.`);
    }

    const newBalance = await this.applyDelta(args.userId, -option.tokenCost);

    const redemption = await this.redemptions.create({
      userId: new Types.ObjectId(args.userId),
      optionId: option._id,
      optionTitle: option.title,
      tokensSpent: option.tokenCost,
      status: 'pending',
    });

    await this.ledger.create({
      userId: new Types.ObjectId(args.userId),
      delta: -option.tokenCost,
      reason: `redemption:${option._id}`,
      referenceId: String(redemption._id),
      balanceAfter: newBalance,
    });

    return { redemption, balance: newBalance };
  }

  async myRedemptions(userId: string) {
    return this.redemptions
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  async listRedemptionsAdmin(status?: 'pending' | 'fulfilled' | 'cancelled') {
    const query: any = {};
    if (status) query.status = status;
    return this.redemptions
      .find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'email name');
  }

  async fulfillRedemption(args: {
    id: string;
    adminId: string;
    status: 'fulfilled' | 'cancelled';
    notes?: string;
  }) {
    const redemption = await this.redemptions.findById(args.id);
    if (!redemption) throw new NotFoundException('Redemption not found');
    if (redemption.status !== 'pending') {
      throw new BadRequestException(`Redemption is already ${redemption.status}`);
    }

    redemption.status = args.status;
    redemption.notes = args.notes;
    redemption.fulfilledAt = new Date();
    redemption.fulfilledBy = new Types.ObjectId(args.adminId);
    await redemption.save();

    if (args.status === 'cancelled') {
      // Refund the tokens.
      const newBalance = await this.applyDelta(
        String(redemption.userId),
        redemption.tokensSpent,
      );
      await this.ledger.create({
        userId: redemption.userId,
        delta: redemption.tokensSpent,
        reason: `refund:${redemption._id}`,
        referenceId: String(redemption._id),
        balanceAfter: newBalance,
      });
    }

    return redemption;
  }

  // --- Balance + history --------------------------------------------------

  async getBalance(userId: string): Promise<number> {
    const p = await this.progress.findOne({ userId: new Types.ObjectId(userId) });
    return p?.tokenBalance ?? 0;
  }

  async myLedger(userId: string, limit = 100) {
    return this.ledger
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // --- Internal -----------------------------------------------------------

  // Mutates UserProgress.tokenBalance atomically and returns the new value.
  // Used for both awards (positive delta) and redemptions (negative).
  private async applyDelta(userId: string, delta: number): Promise<number> {
    const result = await this.progress.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { tokenBalance: delta } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    if (!result) throw new BadRequestException('UserProgress not found');
    if (result.tokenBalance < 0) {
      // Should be unreachable given the pre-check in redeem(), but guard
      // against concurrent redemption races.
      await this.progress.updateOne(
        { userId: new Types.ObjectId(userId) },
        { $inc: { tokenBalance: -delta } },
      );
      throw new BadRequestException('Insufficient token balance');
    }
    return result.tokenBalance;
  }
}
