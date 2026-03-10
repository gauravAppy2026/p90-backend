import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Controller('api')
export class ResourcesController {
  constructor(private resourcesService: ResourcesService) {}

  @Get('resources')
  @UseGuards(JwtAuthGuard)
  findActive(@Query('category') category?: string) {
    return this.resourcesService.findActive(category);
  }

  // --- Admin ---

  @Get('admin/resources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.resourcesService.findAll();
  }

  @Post('admin/resources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: CreateResourceDto) {
    return this.resourcesService.create(body);
  }

  @Patch('admin/resources/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: UpdateResourceDto) {
    return this.resourcesService.update(id, body);
  }

  @Delete('admin/resources/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.resourcesService.delete(id);
  }
}
