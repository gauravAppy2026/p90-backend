import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RedemptionOptionDocument = RedemptionOption & Document;

export type RedemptionKind = 'charity' | 'retreat-discount' | 'merch' | 'consult' | 'other';

@Schema({ timestamps: true })
export class RedemptionOption {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 1 })
  tokenCost: number;

  @Prop({ type: String, required: true, enum: ['charity', 'retreat-discount', 'merch', 'consult', 'other'] })
  kind: RedemptionKind;

  // Free-form payload depending on kind:
  //   charity: { amountUsd: 10 }
  //   retreat-discount: { percent: 10 }
  //   consult: { durationMinutes: 30 }
  @Prop({ type: Object })
  payload?: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;
}

export const RedemptionOptionSchema = SchemaFactory.createForClass(RedemptionOption);
