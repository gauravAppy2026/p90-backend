import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GamificationRuleDocument = GamificationRule & Document;

export const RULE_KEYS = [
  'lesson_complete',
  'checklist_all_done',
  'tracker_entry',
  'progress_photo',
  'streak_7_day',
  'streak_14_day',
  'streak_30_day',
  'program_complete',
] as const;

export type RuleKey = (typeof RULE_KEYS)[number];

// Admin-editable token earn rates. One record per RuleKey.
@Schema({ timestamps: true })
export class GamificationRule {
  @Prop({ type: String, required: true, unique: true, enum: RULE_KEYS })
  key: RuleKey;

  @Prop({ required: true, min: 0 })
  tokens: number;

  @Prop({ required: true })
  description: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const GamificationRuleSchema = SchemaFactory.createForClass(GamificationRule);
