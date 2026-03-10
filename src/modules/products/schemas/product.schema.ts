import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  imageUrl: string;

  @Prop({ required: true })
  affiliateUrl: string;

  @Prop()
  category: string;

  @Prop()
  price: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
