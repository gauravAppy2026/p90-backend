import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DailyTrackerDocument = DailyTracker & Document;

@Schema({ timestamps: true })
export class DailyTracker {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: string;

  @Prop({ required: true })
  dayNumber: number;

  @Prop({ default: 5, min: 1, max: 10 })
  energyLevel: number;

  @Prop({ default: 5, min: 1, max: 10 })
  bodyComfort: number;

  @Prop({ default: 5, min: 1, max: 10 })
  mindset: number;

  @Prop({ default: 0, min: 0, max: 10 })
  penTest: number;

  @Prop()
  notes: string;

  @Prop()
  photoUrl: string;

  @Prop({ type: Map, of: Number, default: {} })
  customTrackers: Map<string, number>;
}

export const DailyTrackerSchema = SchemaFactory.createForClass(DailyTracker);
DailyTrackerSchema.index({ userId: 1, date: 1 }, { unique: true });
