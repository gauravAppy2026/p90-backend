import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ActivePurchaseGuard } from '../../common/guards/active-purchase.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Timezone } from '../../common/decorators/timezone.decorator';
import { ProgramService } from './program.service';
import { CreateDayContentDto } from './dto/create-day-content.dto';
import { UpdateDayContentDto } from './dto/update-day-content.dto';

@Controller('api')
export class ProgramController {
  constructor(private programService: ProgramService) {}

  // --- User endpoints ---

  // Lesson content — gated by purchase so unpaid users can't read it.
  @Get('program/days/:dayNumber')
  @UseGuards(JwtAuthGuard, ActivePurchaseGuard)
  getDayContent(@Param('dayNumber', ParseIntPipe) dayNumber: number) {
    return this.programService.getDayContent(dayNumber);
  }

  // Progress is OPEN — the dashboard reads this to show the
  // pre-purchase "Unlock to start" state.
  @Get('program/progress')
  @UseGuards(JwtAuthGuard)
  getProgress(@CurrentUser('_id') userId: string, @Timezone() timezone: string) {
    return this.programService.getProgress(userId, timezone);
  }

  // Onboarding (demographics, disclaimer, opt-in) runs BEFORE purchase
  // so this endpoint stays open.
  @Post('program/progress/onboarding')
  @UseGuards(JwtAuthGuard)
  saveOnboarding(@CurrentUser('_id') userId: string, @Body() body: any) {
    return this.programService.saveOnboarding(userId, body);
  }

  @Post('program/progress/start')
  @UseGuards(JwtAuthGuard, ActivePurchaseGuard)
  startProgram(@CurrentUser('_id') userId: string) {
    return this.programService.startProgram(userId);
  }

  @Patch('program/progress/complete-day')
  @UseGuards(JwtAuthGuard, ActivePurchaseGuard)
  completeDay(@CurrentUser('_id') userId: string, @Timezone() timezone: string) {
    return this.programService.completeDay(userId, timezone);
  }

  @Post('program/progress/restart')
  @UseGuards(JwtAuthGuard, ActivePurchaseGuard)
  restartProgram(@CurrentUser('_id') userId: string) {
    return this.programService.restartProgram(userId);
  }

  @Get('program/progress/summary')
  @UseGuards(JwtAuthGuard, ActivePurchaseGuard)
  getSummary(@CurrentUser('_id') userId: string) {
    return this.programService.getSummary(userId);
  }

  // --- Admin endpoints ---

  @Get('admin/program/days')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAllDays() {
    return this.programService.getAllDayContent();
  }

  @Get('admin/program/days/:dayNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminDay(@Param('dayNumber', ParseIntPipe) dayNumber: number) {
    return this.programService.getDayContent(dayNumber);
  }

  @Post('admin/program/days')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createDay(@Body() body: CreateDayContentDto) {
    return this.programService.createDayContent(body as any);
  }

  @Put('admin/program/days/:dayNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateDay(
    @Param('dayNumber', ParseIntPipe) dayNumber: number,
    @Body() body: UpdateDayContentDto,
  ) {
    return this.programService.updateDayContent(dayNumber, body as any);
  }
}
