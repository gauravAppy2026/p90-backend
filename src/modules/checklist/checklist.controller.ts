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
import { ChecklistService } from './checklist.service';
import { UpdateChecklistDto } from './dto/update-checklist.dto';

@Controller('api')
export class ChecklistController {
  constructor(private checklistService: ChecklistService) {}

  // --- User endpoints ---

  @Get('checklist/today')
  @UseGuards(JwtAuthGuard)
  getToday(@CurrentUser('_id') userId: string, @Timezone() timezone: string) {
    return this.checklistService.getToday(userId, timezone);
  }

  @Put('checklist/today')
  @UseGuards(JwtAuthGuard)
  updateToday(
    @CurrentUser('_id') userId: string,
    @Body() body: UpdateChecklistDto,
    @Timezone() timezone: string,
  ) {
    return this.checklistService.updateToday(userId, body, timezone);
  }

  @Get('checklist/history')
  @UseGuards(JwtAuthGuard)
  getHistory(@CurrentUser('_id') userId: string) {
    return this.checklistService.getHistory(userId);
  }

  @Get('checklist/config')
  @UseGuards(JwtAuthGuard)
  getActiveConfig() {
    return this.checklistService.getActiveConfig();
  }

  // --- Admin endpoints ---

  @Get('admin/checklist-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAllConfig() {
    return this.checklistService.getAllConfig();
  }

  @Post('admin/checklist-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createConfig(@Body() body: any) {
    return this.checklistService.createConfig(body);
  }

  @Patch('admin/checklist-config/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateConfig(@Param('id') id: string, @Body() body: any) {
    return this.checklistService.updateConfig(id, body);
  }

  @Delete('admin/checklist-config/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteConfig(@Param('id') id: string) {
    return this.checklistService.deleteConfig(id);
  }
}
