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
import { QuickStartService } from './quick-start.service';
import {
  CreateQuickStartVideoDto,
  UpdateQuickStartConfigDto,
  UpdateQuickStartVideoDto,
} from './dto/quick-start.dto';

@Controller('api')
export class QuickStartController {
  constructor(private readonly service: QuickStartService) {}

  // Public — Quick Start is the FREE module, no auth required.
  @Get('quick-start/videos')
  list() {
    return this.service.listActive();
  }

  @Get('quick-start/config')
  getConfig() {
    return this.service.getConfig();
  }

  @Get('admin/quick-start/videos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAdmin() {
    return this.service.listAll();
  }

  @Post('admin/quick-start/videos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: CreateQuickStartVideoDto) {
    return this.service.create(body);
  }

  @Patch('admin/quick-start/videos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: UpdateQuickStartVideoDto) {
    return this.service.update(id, body);
  }

  @Delete('admin/quick-start/videos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Patch('admin/quick-start/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateConfig(@Body() body: UpdateQuickStartConfigDto) {
    return this.service.updateConfig(body);
  }
}
