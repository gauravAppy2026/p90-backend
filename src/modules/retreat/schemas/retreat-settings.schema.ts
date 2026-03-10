import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RetreatSettingsDocument = RetreatSettings & Document;

@Schema({ timestamps: true })
export class RetreatSettings {
  @Prop({ default: 'P90 Wellness Retreat' })
  title: string;

  @Prop()
  description: string;

  @Prop()
  discountCode: string;

  @Prop({ default: 0 })
  discountPercentage: number;

  @Prop()
  countdownEndDate: Date;

  @Prop()
  bookingUrl: string;

  @Prop()
  bannerImageUrl: string;

  @Prop({ default: 15 })
  triggerAfterDay: number;

  @Prop({ default: false })
  isActive: boolean;
}

export const RetreatSettingsSchema =
  SchemaFactory.createForClass(RetreatSettings);
