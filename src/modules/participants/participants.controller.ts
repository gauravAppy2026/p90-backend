import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParticipantsService } from './participants.service';
import { InviteFreeAccessDto } from './dto/invite.dto';

@Controller('api/admin/participants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ParticipantsController {
  constructor(private readonly participants: ParticipantsService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('gender') gender?: string,
    @Query('minTrackerDays') minTrackerDays?: string,
    @Query('okToContact') okToContact?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.participants.list({
      search,
      gender,
      minTrackerDays: minTrackerDays != null ? Number(minTrackerDays) : undefined,
      okToContact:
        okToContact === 'true' ? true : okToContact === 'false' ? false : undefined,
      sortBy,
      order,
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
    });
  }

  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.participants.exportTrackerCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=numa-tracker-data.csv');
    res.send(csv);
  }

  // Gentle re-engagement email.
  @Post(':userId/nudge')
  nudge(@Param('userId') userId: string) {
    return this.participants.sendNudge(userId);
  }

  // Mint + email a free-access unlock code to a strong tracker.
  @Post(':userId/invite')
  invite(
    @CurrentUser('_id') adminId: string,
    @Param('userId') userId: string,
    @Body() body: InviteFreeAccessDto,
  ) {
    return this.participants.inviteToFreeAccess(adminId, userId, body.product);
  }
}
