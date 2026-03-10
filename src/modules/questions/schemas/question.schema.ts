import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDocument = Question & Document;

export enum QuestionCategory {
  DEVICE = 'device',
  PROGRAM = 'program',
  HEALTH = 'health',
  TECHNICAL = 'technical',
  OTHER = 'other',
}

export enum QuestionStatus {
  PENDING = 'pending',
  ANSWERED = 'answered',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true })
export class Question {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  question: string;

  @Prop()
  answer: string;

  @Prop({
    type: String,
    enum: QuestionCategory,
    default: QuestionCategory.OTHER,
  })
  category: QuestionCategory;

  @Prop({
    type: String,
    enum: QuestionStatus,
    default: QuestionStatus.PENDING,
    index: true,
  })
  status: QuestionStatus;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  answeredBy: Types.ObjectId;

  @Prop()
  answeredAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
