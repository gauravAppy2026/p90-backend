import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SaqQuestionDocument = SaqQuestion & Document;

export const QUESTION_TYPES = [
  'short-text',
  'long-text',
  'number',
  'dropdown',
  'scale-1-10',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

// Admin-editable Self-Assessment Questionnaire master list. Mobile users
// (All-In members) see active questions in section/order, fill them in
// before the All-In consultation.
@Schema({ timestamps: true })
export class SaqQuestion {
  @Prop({ required: true })
  text: string;

  @Prop({ type: String, required: true, enum: QUESTION_TYPES })
  type: QuestionType;

  @Prop()
  helpText?: string;

  @Prop()
  placeholder?: string;

  // Only used when type === 'dropdown'.
  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ default: false })
  required: boolean;

  // Logical grouping shown as a section header in mobile.
  @Prop({ required: true })
  section: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const SaqQuestionSchema = SchemaFactory.createForClass(SaqQuestion);
SaqQuestionSchema.index({ isActive: 1, section: 1, order: 1 });
