import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { NutritionService } from './nutrition.service';
import { UpdateNutritionContentDto } from './dto/nutrition.dto';

@Controller('api')
export class NutritionController {
  constructor(private readonly service: NutritionService) {}

  @Get('nutrition/content')
  getContent() {
    return this.service.getContent();
  }

  @Patch('admin/nutrition/content')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateContent(@Body() body: UpdateNutritionContentDto) {
    return this.service.updateContent(body);
  }
}
