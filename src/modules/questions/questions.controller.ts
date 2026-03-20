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
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { UpdateQuestionStatusDto } from './dto/update-question-status.dto';

@Controller('api')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  // --- User endpoints ---

  @Post('questions')
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser('_id') userId: string, @Body() body: CreateQuestionDto) {
    return this.questionsService.create(userId, body);
  }

  @Get('questions/faq')
  @UseGuards(JwtAuthGuard)
  getPublicFaqs() {
    return this.questionsService.getPublicFaqs();
  }

  @Get('questions/mine')
  @UseGuards(JwtAuthGuard)
  getMyQuestions(@CurrentUser('_id') userId: string) {
    return this.questionsService.getMyQuestions(userId);
  }

  // --- Admin endpoints ---

  @Get('admin/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll(@Query('status') status?: string, @Query('page') page = 1) {
    return this.questionsService.findAll(status, page);
  }

  @Patch('admin/questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  answer(
    @Param('id') id: string,
    @CurrentUser('_id') adminId: string,
    @Body() body: AnswerQuestionDto,
  ) {
    return this.questionsService.answer(id, adminId, body);
  }

  @Patch('admin/questions/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateQuestionStatusDto,
  ) {
    return this.questionsService.updateStatus(id, body.status);
  }
}
