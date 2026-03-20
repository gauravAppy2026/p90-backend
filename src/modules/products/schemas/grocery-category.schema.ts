import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GroceryCategoryDocument = GroceryCategory & Document;

@Schema({ timestamps: true })
export class GroceryCategory {
  @Prop({ required: true })
  title: string;

  @Prop({ default: 'nutrition-outline' })
  icon: string;

  @Prop({ type: [String], default: [] })
  items: string[];

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const GroceryCategorySchema = SchemaFactory.createForClass(GroceryCategory);
