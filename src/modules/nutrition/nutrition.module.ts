import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NutritionContent,
  NutritionContentSchema,
} from './schemas/nutrition-content.schema';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NutritionContent.name, schema: NutritionContentSchema },
    ]),
  ],
  providers: [NutritionService],
  controllers: [NutritionController],
  exports: [NutritionService],
})
export class NutritionModule {}
