import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupplementDocument = Supplement & Document;

@Schema({ timestamps: true })
export class Supplement {
  @Prop({ required: true })
  name: string;

  @Prop()
  purpose: string;

  @Prop()
  url: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const SupplementSchema = SchemaFactory.createForClass(Supplement);
