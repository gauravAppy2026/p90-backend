import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DayContentDocument = DayContent & Document;

@Schema({ timestamps: true })
export class DayContent {
  @Prop({ required: true, unique: true, index: true, min: 1, max: 30 })
  dayNumber: number;

  @Prop({ required: true })
  title: string;

  @Prop()
  videoUrl: string;

  @Prop()
  audioUrl: string;

  @Prop()
  textContent: string;

  @Prop()
  summary: string;

  @Prop({ type: [String], default: [] })
  tips: string[];

  @Prop({
    type: [{ label: String, description: String, icon: String }],
    default: [],
  })
  checklistItems: { label: string; description: string; icon: string }[];

  @Prop()
  reflectionPrompt: string;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ default: 0 })
  order: number;
}

export const DayContentSchema = SchemaFactory.createForClass(DayContent);
