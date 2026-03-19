import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Timezone } from '../../common/decorators/timezone.decorator';
import { ChecklistService } from './checklist.service';
import { UpdateChecklistDto } from './dto/update-checklist.dto';

@Controller('api/checklist')
@UseGuards(JwtAuthGuard)
export class ChecklistController {
  constructor(private checklistService: ChecklistService) {}

  @Get('today')
  getToday(@CurrentUser('_id') userId: string, @Timezone() timezone: string) {
    return this.checklistService.getToday(userId, timezone);
  }

  @Put('today')
  updateToday(@CurrentUser('_id') userId: string, @Body() body: UpdateChecklistDto, @Timezone() timezone: string) {
    return this.checklistService.updateToday(userId, body, timezone);
  }

  @Get('history')
  getHistory(@CurrentUser('_id') userId: string) {
    return this.checklistService.getHistory(userId);
  }
}
