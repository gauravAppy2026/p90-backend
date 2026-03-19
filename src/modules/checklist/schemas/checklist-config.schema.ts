import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChecklistConfigDocument = ChecklistConfig & Document;

@Schema({ timestamps: true })
export class ChecklistConfig {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  label: string;

  @Prop()
  description: string;

  @Prop({ default: 'checkbox-outline' })
  icon: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ChecklistConfigSchema =
  SchemaFactory.createForClass(ChecklistConfig);
