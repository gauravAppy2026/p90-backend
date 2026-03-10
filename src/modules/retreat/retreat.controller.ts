import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RetreatService } from './retreat.service';
import { UpdateRetreatSettingsDto } from './dto/update-retreat-settings.dto';

@Controller('api')
export class RetreatController {
  constructor(private retreatService: RetreatService) {}

  @Get('retreat')
  @UseGuards(JwtAuthGuard)
  getSettings() {
    return this.retreatService.getSettings();
  }

  // --- Admin ---

  @Get('admin/retreat')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminSettings() {
    return this.retreatService.getSettings();
  }

  @Put('admin/retreat')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateSettings(@Body() body: UpdateRetreatSettingsDto) {
    return this.retreatService.updateSettings(body as any);
  }
}
