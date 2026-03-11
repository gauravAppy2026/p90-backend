import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  async findActive(): Promise<ProductDocument[]> {
    return this.productModel.find({ isActive: true }).sort({ order: 1 });
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().sort({ order: 1 });
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(data: Partial<Product>): Promise<ProductDocument> {
    return this.productModel.create(data);
  }

  async update(id: string, data: Partial<Product>): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async delete(id: string): Promise<void> {
    const product = await this.productModel.findByIdAndDelete(id);
    if (!product) throw new NotFoundException('Product not found');
  }
}
