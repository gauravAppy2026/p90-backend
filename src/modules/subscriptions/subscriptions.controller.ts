import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { GenerateCodesDto, RedeemCodeDto } from './dto/generate-codes.dto';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private subs: SubscriptionsService) {}

  // --- User-facing --------------------------------------------------------

  @Get('subscriptions/my-purchases')
  myPurchases(@CurrentUser('_id') userId: string) {
    return this.subs.listPurchases(userId);
  }

  @Get('subscriptions/my-cycles')
  myCycles(@CurrentUser('_id') userId: string) {
    return this.subs.listCycles(userId);
  }

  @Post('subscriptions/redeem-code')
  redeem(@CurrentUser('_id') userId: string, @Body() body: RedeemCodeDto) {
    return this.subs.redeemCode({ userId, code: body.code });
  }

  // --- Admin --------------------------------------------------------------

  @Get('admin/unlock-codes')
  @UseGuards(RolesGuard)
  @Roles('admin')
  listCodes(@Query('status') status?: 'unused' | 'redeemed' | 'revoked' | 'all') {
    return this.subs.listCodes(status);
  }

  @Post('admin/unlock-codes/generate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  generate(@CurrentUser('_id') adminId: string, @Body() body: GenerateCodesDto) {
    return this.subs.generateCodes({
      count: body.count,
      createdBy: adminId,
      notes: body.notes,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
  }

  @Delete('admin/unlock-codes/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  revoke(@Param('id') id: string) {
    return this.subs.revokeCode(id);
  }

  @Get('admin/users/:userId/purchases')
  @UseGuards(RolesGuard)
  @Roles('admin')
  userPurchases(@Param('userId') userId: string) {
    return this.subs.listPurchases(userId);
  }
}
