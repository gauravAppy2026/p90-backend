import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TokenLedgerDocument = TokenLedger & Document;

// Append-only audit of every token earn/spend. UserProgress.tokenBalance
// is the cached running total — this collection is the source of truth.
@Schema({ timestamps: true })
export class TokenLedger {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // Positive = earn, negative = spend. Never zero.
  @Prop({ required: true })
  delta: number;

  // Matches a key in the GamificationRule collection for earns,
  // or "redemption:<optionId>" for spends.
  @Prop({ required: true })
  reason: string;

  // Optional pointer to the thing that triggered the entry — e.g. the
  // dayNumber for a lesson_complete, the redemption record id for a spend.
  @Prop()
  referenceId?: string;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ default: 1 })
  monthCycle?: number; // which program cycle this entry belongs to
}

export const TokenLedgerSchema = SchemaFactory.createForClass(TokenLedger);
TokenLedgerSchema.index({ userId: 1, createdAt: -1 });
