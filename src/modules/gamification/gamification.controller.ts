import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GamificationService } from './gamification.service';
import {
  CreateRedemptionOptionDto,
  FulfillRedemptionDto,
  RedeemDto,
  UpdateRedemptionOptionDto,
  UpdateRuleDto,
} from './dto/gamification.dto';
import type { RuleKey } from './schemas/gamification-rule.schema';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private game: GamificationService) {}

  // --- User-facing --------------------------------------------------------

  @Get('gamification/balance')
  async balance(@CurrentUser('_id') userId: string) {
    const balance = await this.game.getBalance(userId);
    return { balance };
  }

  @Get('gamification/ledger')
  ledger(@CurrentUser('_id') userId: string) {
    return this.game.myLedger(userId);
  }

  @Get('gamification/options')
  options() {
    return this.game.listOptions(true);
  }

  @Post('gamification/redeem')
  redeem(@CurrentUser('_id') userId: string, @Body() body: RedeemDto) {
    return this.game.redeem({ userId, optionId: body.optionId });
  }

  @Get('gamification/my-redemptions')
  myRedemptions(@CurrentUser('_id') userId: string) {
    return this.game.myRedemptions(userId);
  }

  // --- Admin: rules -------------------------------------------------------

  @Get('admin/gamification/rules')
  @UseGuards(RolesGuard)
  @Roles('admin')
  listRules() {
    return this.game.listRules();
  }

  @Patch('admin/gamification/rules/:key')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateRule(@Param('key') key: RuleKey, @Body() body: UpdateRuleDto) {
    return this.game.updateRule(key, body);
  }

  // --- Admin: redemption options -----------------------------------------

  @Get('admin/gamification/options')
  @UseGuards(RolesGuard)
  @Roles('admin')
  listOptionsAdmin() {
    return this.game.listOptions(false);
  }

  @Post('admin/gamification/options')
  @UseGuards(RolesGuard)
  @Roles('admin')
  createOption(@Body() body: CreateRedemptionOptionDto) {
    return this.game.createOption(body);
  }

  @Patch('admin/gamification/options/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateOption(@Param('id') id: string, @Body() body: UpdateRedemptionOptionDto) {
    return this.game.updateOption(id, body);
  }

  @Delete('admin/gamification/options/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  deleteOption(@Param('id') id: string) {
    return this.game.deleteOption(id);
  }

  // --- Admin: redemptions queue ------------------------------------------

  @Get('admin/gamification/redemptions')
  @UseGuards(RolesGuard)
  @Roles('admin')
  listRedemptions(@Query('status') status?: 'pending' | 'fulfilled' | 'cancelled') {
    return this.game.listRedemptionsAdmin(status);
  }

  @Patch('admin/gamification/redemptions/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  fulfill(
    @CurrentUser('_id') adminId: string,
    @Param('id') id: string,
    @Body() body: FulfillRedemptionDto,
  ) {
    return this.game.fulfillRedemption({
      id,
      adminId,
      status: body.status,
      notes: body.notes,
    });
  }
}
