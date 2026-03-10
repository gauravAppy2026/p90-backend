import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClickEventDocument = ClickEvent & Document;

export enum EventType {
  PRODUCT_CLICK = 'product_click',
  RETREAT_VISIT = 'retreat_visit',
  RESOURCE_CLICK = 'resource_click',
  AFFILIATE_CLICK = 'affiliate_click',
}

@Schema({ timestamps: true })
export class ClickEvent {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: EventType, required: true, index: true })
  eventType: EventType;

  @Prop()
  targetId: string;

  @Prop()
  targetUrl: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const ClickEventSchema = SchemaFactory.createForClass(ClickEvent);
ClickEventSchema.index({ createdAt: 1 });
