import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UnlockCodeDocument = UnlockCode & Document;

@Schema({ timestamps: true })
export class UnlockCode {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string; // e.g. "A4F7K2"

  @Prop({ type: String, required: true, default: 'all-in', enum: ['all-in', '30-day-recharge'] })
  product: 'all-in' | '30-day-recharge';

  @Prop({ type: String, default: 'unused', enum: ['unused', 'redeemed', 'revoked'] })
  status: 'unused' | 'redeemed' | 'revoked';

  @Prop({ type: Types.ObjectId, ref: 'User' })
  redeemedBy?: Types.ObjectId;

  @Prop()
  redeemedAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId; // admin who generated the batch

  @Prop()
  notes?: string; // admin notes — e.g. "Sept-2026 batch", buyer's email
}

export const UnlockCodeSchema = SchemaFactory.createForClass(UnlockCode);
UnlockCodeSchema.index({ status: 1, createdAt: -1 });
