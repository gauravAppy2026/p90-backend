import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ProgramService } from '../program/program.service';
import { TrackerService } from '../tracker/tracker.service';
import { ChecklistService } from '../checklist/checklist.service';

@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private programService: ProgramService,
    private trackerService: TrackerService,
    private checklistService: ChecklistService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    return this.usersService.findAll(query, page, limit);
  }

  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const { users } = await this.usersService.findAll({}, 1, 10000);

    const headers = [
      'Name',
      'Email',
      'Role',
      'Consent',
      'Active',
      'Created At',
    ];
    const rows = users.map((u) =>
      [
        u.name,
        u.email,
        u.role,
        u.consentStatus,
        u.isActive,
        (u as any).createdAt,
      ].join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  }

  @Get(':id/progress')
  async getUserProgress(@Param('id') id: string) {
    const [user, progress, trackerHistory, checklistHistory] = await Promise.all([
      this.usersService.findById(id),
      this.programService.getProgress(id),
      this.trackerService.getHistory(id, 30),
      this.checklistService.getHistory(id, 30),
    ]);
    return {
      user: user ? { name: user.name, email: user.email, role: user.role } : null,
      progress,
      trackerHistory,
      checklistHistory,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: UpdateUserDto) {
    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.softDelete(id);
    return { message: 'User deactivated' };
  }
}
