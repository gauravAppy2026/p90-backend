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
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProgramService } from './program.service';
import { CreateDayContentDto } from './dto/create-day-content.dto';
import { UpdateDayContentDto } from './dto/update-day-content.dto';

@Controller('api')
export class ProgramController {
  constructor(private programService: ProgramService) {}

  // --- User endpoints ---

  @Get('program/days/:dayNumber')
  @UseGuards(JwtAuthGuard)
  getDayContent(@Param('dayNumber', ParseIntPipe) dayNumber: number) {
    return this.programService.getDayContent(dayNumber);
  }

  @Get('program/progress')
  @UseGuards(JwtAuthGuard)
  getProgress(@CurrentUser('_id') userId: string) {
    return this.programService.getProgress(userId);
  }

  @Post('program/progress/start')
  @UseGuards(JwtAuthGuard)
  startProgram(@CurrentUser('_id') userId: string) {
    return this.programService.startProgram(userId);
  }

  @Patch('program/progress/complete-day')
  @UseGuards(JwtAuthGuard)
  completeDay(@CurrentUser('_id') userId: string) {
    return this.programService.completeDay(userId);
  }

  @Get('program/progress/summary')
  @UseGuards(JwtAuthGuard)
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
