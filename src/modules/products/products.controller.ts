import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProductsService } from './products.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('api')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get('products')
  @UseGuards(JwtAuthGuard)
  findActive() {
    return this.productsService.findActive();
  }

  @Post('products/:id/click')
  @UseGuards(JwtAuthGuard)
  async trackClick(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
  ) {
    const product = await this.productsService.findById(id);
    await this.analyticsService.trackClick(userId, {
      eventType: 'product_click',
      targetId: id,
      targetUrl: product.affiliateUrl,
    });
    return { message: 'Click tracked' };
  }

  // --- Admin ---

  @Get('admin/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.productsService.findAll();
  }

  @Post('admin/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  @Patch('admin/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, body);
  }

  @Delete('admin/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
