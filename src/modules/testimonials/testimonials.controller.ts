import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';

@Controller('api')
export class TestimonialsController {
  constructor(private testimonialsService: TestimonialsService) {}

  @Post('testimonials')
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser('_id') userId: string, @Body() body: CreateTestimonialDto) {
    return this.testimonialsService.create(userId, body);
  }

  @Get('testimonials/approved')
  @UseGuards(JwtAuthGuard)
  getApproved() {
    return this.testimonialsService.getApproved();
  }

  // --- Admin ---

  @Get('admin/testimonials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll(@Query('status') status?: string, @Query('page') page = 1) {
    return this.testimonialsService.findAll(status, page);
  }

  @Patch('admin/testimonials/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  review(
    @Param('id') id: string,
    @CurrentUser('_id') adminId: string,
    @Body('status') status: 'approved' | 'rejected',
  ) {
    return this.testimonialsService.review(id, adminId, status);
  }
}
