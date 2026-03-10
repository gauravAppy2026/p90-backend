import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DailyChecklistDocument = DailyChecklist & Document;

@Schema({ _id: false })
export class ChecklistItems {
  @Prop({ default: false })
  p90Session: boolean;

  @Prop({ default: false })
  morningSmoothie: boolean;

  @Prop({ default: false })
  waterIntake: boolean;

  @Prop({ default: false })
  vitaminsMinerals: boolean;

  @Prop({ default: false })
  movement: boolean;

  @Prop({ default: false })
  mindfulness: boolean;
}

@Schema({ timestamps: true })
export class DailyChecklist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: string;

  @Prop({ required: true })
  dayNumber: number;

  @Prop({ type: ChecklistItems, default: () => ({}) })
  items: ChecklistItems;

  @Prop({ default: 0 })
  completionCount: number;
}

export const DailyChecklistSchema =
  SchemaFactory.createForClass(DailyChecklist);
DailyChecklistSchema.index({ userId: 1, date: 1 }, { unique: true });
