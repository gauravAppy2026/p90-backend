import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { GroceryCategory, GroceryCategoryDocument } from './schemas/grocery-category.schema';
import { Supplement, SupplementDocument } from './schemas/supplement.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(GroceryCategory.name) private groceryModel: Model<GroceryCategoryDocument>,
    @InjectModel(Supplement.name) private supplementModel: Model<SupplementDocument>,
  ) {}

  // --- Products ---
  async findActive(): Promise<ProductDocument[]> {
    return this.productModel.find({ isActive: true }).sort({ order: 1 });
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().sort({ order: 1 });
  }

  async create(data: Partial<Product>): Promise<ProductDocument> {
    return this.productModel.create(data);
  }

  async update(id: string, data: Partial<Product>): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndUpdate(id, data, { new: true });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async delete(id: string): Promise<void> {
    const product = await this.productModel.findByIdAndDelete(id);
    if (!product) throw new NotFoundException('Product not found');
  }

  // --- Grocery Categories ---
  async getActiveGroceries(): Promise<GroceryCategoryDocument[]> {
    return this.groceryModel.find({ isActive: true }).sort({ order: 1 });
  }

  async getAllGroceries(): Promise<GroceryCategoryDocument[]> {
    return this.groceryModel.find().sort({ order: 1 });
  }

  async createGrocery(data: Partial<GroceryCategory>): Promise<GroceryCategoryDocument> {
    return this.groceryModel.create(data);
  }

  async updateGrocery(id: string, data: Partial<GroceryCategory>): Promise<GroceryCategoryDocument> {
    const item = await this.groceryModel.findByIdAndUpdate(id, data, { new: true });
    if (!item) throw new NotFoundException('Grocery category not found');
    return item;
  }

  async deleteGrocery(id: string): Promise<void> {
    const item = await this.groceryModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException('Grocery category not found');
  }

  // --- Supplements ---
  async getActiveSupplements(): Promise<SupplementDocument[]> {
    return this.supplementModel.find({ isActive: true }).sort({ order: 1 });
  }

  async getAllSupplements(): Promise<SupplementDocument[]> {
    return this.supplementModel.find().sort({ order: 1 });
  }

  async createSupplement(data: Partial<Supplement>): Promise<SupplementDocument> {
    return this.supplementModel.create(data);
  }

  async updateSupplement(id: string, data: Partial<Supplement>): Promise<SupplementDocument> {
    const item = await this.supplementModel.findByIdAndUpdate(id, data, { new: true });
    if (!item) throw new NotFoundException('Supplement not found');
    return item;
  }

  async deleteSupplement(id: string): Promise<void> {
    const item = await this.supplementModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException('Supplement not found');
  }

  // --- Combined shop data for mobile ---
  async getShopData() {
    const [groceries, supplements, products] = await Promise.all([
      this.getActiveGroceries(),
      this.getActiveSupplements(),
      this.findActive(),
    ]);
    return { groceries, supplements, products };
  }
}
