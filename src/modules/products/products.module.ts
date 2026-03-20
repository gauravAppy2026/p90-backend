import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { GroceryCategory, GroceryCategorySchema } from './schemas/grocery-category.schema';
import { Supplement, SupplementSchema } from './schemas/supplement.schema';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: GroceryCategory.name, schema: GroceryCategorySchema },
      { name: Supplement.name, schema: SupplementSchema },
    ]),
    AnalyticsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
