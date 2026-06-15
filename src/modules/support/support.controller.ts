import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SupportService } from './support.service';
import { ContactSupportDto } from './dto/contact.dto';

@Controller('api')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('support/contact')
  @UseGuards(JwtAuthGuard)
  async contact(
    @CurrentUser() user: { email: string; name: string },
    @Body() body: ContactSupportDto,
  ) {
    return this.support.sendContactRequest({
      fromName: user?.name || 'NUMA user',
      fromEmail: user?.email,
      subject: body.subject,
      message: body.message,
    });
  }
}
