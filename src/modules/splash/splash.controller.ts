import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SplashService } from './splash.service';
import { UpdateSplashConfigDto } from './dto/splash.dto';

@Controller('api')
export class SplashController {
  constructor(private splash: SplashService) {}

  // Public — mobile app fetches this on launch (and pre-login).
  @Get('splash/config')
  getConfig() {
    return this.splash.getConfig();
  }

  @Get('admin/splash/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getConfigAdmin() {
    return this.splash.getConfig();
  }

  @Put('admin/splash/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateConfig(@Body() body: UpdateSplashConfigDto) {
    return this.splash.updateConfig(body);
  }
}
