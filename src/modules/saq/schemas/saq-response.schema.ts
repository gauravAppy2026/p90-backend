import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SaqResponseDocument = SaqResponse & Document;

// One response per user (upserted). Stores answers as a map keyed by
// SaqQuestion._id (string) — values are strings (the form serialises
// numbers/scale to strings before sending). This lets question changes
// happen without invalidating older responses.
@Schema({ timestamps: true })
export class SaqResponse {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // { [questionId]: answer }
  @Prop({ type: Object, default: {} })
  answers: Record<string, string>;

  @Prop()
  submittedAt?: Date;

  @Prop({ default: false })
  submitted: boolean; // false = draft, true = sealed by user
}

export const SaqResponseSchema = SchemaFactory.createForClass(SaqResponse);
