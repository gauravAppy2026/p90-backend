import {
  Controller,
  Get,
  Put,
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
import { Timezone } from '../../common/decorators/timezone.decorator';
import { TrackerService } from './tracker.service';
import { UpdateTrackerDto } from './dto/update-tracker.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('api')
export class TrackerController {
  constructor(private trackerService: TrackerService) {}

  // --- User endpoints ---

  @Get('tracker/today')
  @UseGuards(JwtAuthGuard)
  getToday(@CurrentUser('_id') userId: string, @Timezone() timezone: string) {
    return this.trackerService.getToday(userId, timezone);
  }

  @Put('tracker/today')
  @UseGuards(JwtAuthGuard)
  updateToday(@CurrentUser('_id') userId: string, @Body() body: UpdateTrackerDto, @Timezone() timezone: string) {
    return this.trackerService.updateToday(userId, body as any, timezone);
  }

  @Get('tracker/history')
  @UseGuards(JwtAuthGuard)
  getHistory(@CurrentUser('_id') userId: string) {
    return this.trackerService.getHistory(userId);
  }

  @Get('tracker/categories')
  @UseGuards(JwtAuthGuard)
  getCategories() {
    return this.trackerService.getActiveCategories();
  }

  // --- Admin endpoints ---

  @Get('admin/tracker-categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAllCategories() {
    return this.trackerService.getAllCategories();
  }

  @Post('admin/tracker-categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createCategory(@Body() body: CreateCategoryDto) {
    return this.trackerService.createCategory(body);
  }

  @Patch('admin/tracker-categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateCategory(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    return this.trackerService.updateCategory(id, body);
  }

  @Delete('admin/tracker-categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteCategory(@Param('id') id: string) {
    return this.trackerService.deleteCategory(id);
  }
}
