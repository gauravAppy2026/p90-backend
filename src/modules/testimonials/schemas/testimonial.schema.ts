import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TestimonialDocument = Testimonial & Document;

export enum TestimonialStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Testimonial {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop()
  imageUrl: string;

  @Prop({ default: false })
  consentToPublish: boolean;

  @Prop({
    type: String,
    enum: TestimonialStatus,
    default: TestimonialStatus.PENDING,
    index: true,
  })
  status: TestimonialStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy: Types.ObjectId;

  @Prop()
  reviewedAt: Date;
}

export const TestimonialSchema = SchemaFactory.createForClass(Testimonial);
