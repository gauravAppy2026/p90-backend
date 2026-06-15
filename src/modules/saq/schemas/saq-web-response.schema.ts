import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SaqWebResponseDocument = SaqWebResponse & Document;

// Public web-form submissions of the Self-Assessment from people who are
// NOT app users (no userId). Kept in its own collection so the existing
// per-user SaqResponse unique index is untouched. Keyed by email — a
// re-submission from the same email updates the existing record.
@Schema({ timestamps: true })
export class SaqWebResponse {
  @Prop({ required: true, trim: true })
  respondentName: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  respondentEmail: string;

  // { [questionId]: answer }
  @Prop({ type: Object, default: {} })
  answers: Record<string, string>;

  @Prop()
  submittedAt?: Date;

  @Prop({ default: 'web' })
  source: string;
}

export const SaqWebResponseSchema = SchemaFactory.createForClass(SaqWebResponse);
