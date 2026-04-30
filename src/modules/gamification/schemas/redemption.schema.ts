import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RedemptionDocument = Redemption & Document;

@Schema({ timestamps: true })
export class Redemption {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RedemptionOption', required: true })
  optionId: Types.ObjectId;

  // Snapshot at time of redemption — option config can change later.
  @Prop({ required: true })
  optionTitle: string;

  @Prop({ required: true })
  tokensSpent: number;

  @Prop({ type: String, default: 'pending', enum: ['pending', 'fulfilled', 'cancelled'] })
  status: 'pending' | 'fulfilled' | 'cancelled';

  @Prop()
  notes?: string; // admin notes on fulfilment (e.g. donation receipt #, retreat code)

  @Prop()
  fulfilledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  fulfilledBy?: Types.ObjectId;
}

export const RedemptionSchema = SchemaFactory.createForClass(Redemption);
RedemptionSchema.index({ userId: 1, createdAt: -1 });
