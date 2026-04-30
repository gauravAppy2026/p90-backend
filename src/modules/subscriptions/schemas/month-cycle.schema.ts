import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MonthCycleDocument = MonthCycle & Document;

// Each time the user starts (or restarts) the 30-day program we create a
// new MonthCycle. Cycle 1 = first run, cycle 2 = first restart, etc.
// Trackers/checklists/photos are tied to the active cycle so Month 2
// progress doesn't overwrite Month 1 history.
@Schema({ timestamps: true })
export class MonthCycle {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  monthNumber: number;

  @Prop({ required: true, default: false })
  isActive: boolean; // exactly one active cycle per user

  @Prop({ required: true })
  startedAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ default: 0, min: 0, max: 30 })
  completedDays: number;

  @Prop({ default: 0 })
  completionPercentage: number;
}

export const MonthCycleSchema = SchemaFactory.createForClass(MonthCycle);
MonthCycleSchema.index({ userId: 1, monthNumber: 1 }, { unique: true });
MonthCycleSchema.index({ userId: 1, isActive: 1 });
