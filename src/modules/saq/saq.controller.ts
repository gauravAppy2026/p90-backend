import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SaqService } from './saq.service';
import {
  CreateSaqQuestionDto,
  PublicSaqSubmitDto,
  SaveResponseDto,
  UpdateSaqQuestionDto,
} from './dto/saq.dto';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class SaqController {
  constructor(private saq: SaqService) {}

  // --- User-facing --------------------------------------------------------

  // In-app questions. Defaults to the lighter 'basic' check-in; NUMA Plus
  // members can request the clinical intake with ?form=clinical.
  @Get('saq/questions')
  listQuestions(@Query('form') form?: string) {
    return this.saq.listActive(form === 'clinical' ? 'clinical' : 'basic');
  }

  @Get('saq/my-response')
  myResponse(@CurrentUser('_id') userId: string) {
    return this.saq.getMyResponse(userId);
  }

  @Put('saq/my-response')
  saveResponse(@CurrentUser('_id') userId: string, @Body() body: SaveResponseDto) {
    return this.saq.saveMyResponse(userId, body);
  }

  // --- Admin --------------------------------------------------------------

  @Get('admin/saq/questions')
  @UseGuards(RolesGuard)
  @Roles('admin')
  listAllQuestions() {
    return this.saq.listAllQuestions();
  }

  @Post('admin/saq/questions')
  @UseGuards(RolesGuard)
  @Roles('admin')
  createQuestion(@Body() body: CreateSaqQuestionDto) {
    return this.saq.createQuestion(body);
  }

  @Patch('admin/saq/questions/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateQuestion(@Param('id') id: string, @Body() body: UpdateSaqQuestionDto) {
    return this.saq.updateQuestion(id, body);
  }

  @Delete('admin/saq/questions/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  deleteQuestion(@Param('id') id: string) {
    return this.saq.deleteQuestion(id);
  }

  @Get('admin/saq/responses')
  @UseGuards(RolesGuard)
  @Roles('admin')
  listResponses(
    @Query('questionId') questionId?: string,
    @Query('value') value?: string,
  ) {
    return this.saq.listResponses({ questionId, value });
  }

  // Research export — declared before :id so "export" isn't read as an id.
  @Get('admin/saq/responses/export/csv')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async exportResponses(@Res() res: Response, @Query('form') form?: string) {
    const csv = await this.saq.exportResponsesCsv(form === 'basic' ? 'basic' : 'clinical');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=numa-self-assessment.csv');
    res.send(csv);
  }

  @Get('admin/saq/responses/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getResponse(@Param('id') id: string) {
    return this.saq.getResponse(id);
  }
}

// Public, no-auth endpoints powering the shareable web Self-Assessment
// form for people who aren't app users.
@Controller('api/public/saq')
export class PublicSaqController {
  constructor(private saq: SaqService) {}

  @Get('questions')
  questions() {
    return this.saq.listActivePublic();
  }

  @Post('submit')
  submit(@Body() body: PublicSaqSubmitDto) {
    return this.saq.submitWebResponse(body);
  }
}
