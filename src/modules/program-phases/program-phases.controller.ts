import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProgramPhasesService } from './program-phases.service';
import {
  CreateProgramPhaseDto,
  UpdateProgramPhaseDto,
} from './dto/program-phase.dto';

@Controller('api')
export class ProgramPhasesController {
  constructor(private readonly service: ProgramPhasesService) {}

  // Public — the mobile program-overview screen reads this.
  @Get('program/phases')
  list() {
    return this.service.listActive();
  }

  @Get('admin/program/phases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAdmin() {
    return this.service.listAll();
  }

  @Post('admin/program/phases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: CreateProgramPhaseDto) {
    return this.service.create(body);
  }

  @Patch('admin/program/phases/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: UpdateProgramPhaseDto) {
    return this.service.update(id, body);
  }

  @Delete('admin/program/phases/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
