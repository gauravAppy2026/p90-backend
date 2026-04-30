import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SaqService } from './saq.service';
import {
  CreateSaqQuestionDto,
  SaveResponseDto,
  UpdateSaqQuestionDto,
} from './dto/saq.dto';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class SaqController {
  constructor(private saq: SaqService) {}

  // --- User-facing --------------------------------------------------------

  @Get('saq/questions')
  listQuestions() {
    return this.saq.listActive();
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
  listResponses() {
    return this.saq.listResponses();
  }

  @Get('admin/saq/responses/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getResponse(@Param('userId') userId: string) {
    return this.saq.getResponse(userId);
  }
}
