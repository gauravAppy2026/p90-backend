import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserProgressDocument = UserProgress & Document;

@Schema({ timestamps: true })
export class UserProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: 1, min: 1, max: 30 })
  currentDay: number;

  @Prop({ default: false })
  programStarted: boolean;

  @Prop({ default: false })
  disclaimerAccepted: boolean;

  @Prop()
  startDate: Date;

  @Prop({ type: [Number], default: [] })
  completedLessons: number[];

  @Prop({ default: 0 })
  completionPercentage: number;

  @Prop({ default: 0 })
  streakCount: number;

  @Prop()
  lastActiveDate: Date;

  @Prop()
  lastLessonCompletedDate: string; // YYYY-MM-DD in user's timezone
}

export const UserProgressSchema = SchemaFactory.createForClass(UserProgress);
UserProgressSchema.index({ userId: 1 }, { unique: true });
