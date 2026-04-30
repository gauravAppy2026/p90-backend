import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GamificationRule,
  GamificationRuleSchema,
} from './schemas/gamification-rule.schema';
import {
  RedemptionOption,
  RedemptionOptionSchema,
} from './schemas/redemption-option.schema';
import {
  Redemption,
  RedemptionSchema,
} from './schemas/redemption.schema';
import {
  TokenLedger,
  TokenLedgerSchema,
} from './schemas/token-ledger.schema';
import {
  UserProgress,
  UserProgressSchema,
} from '../program/schemas/user-progress.schema';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GamificationRule.name, schema: GamificationRuleSchema },
      { name: RedemptionOption.name, schema: RedemptionOptionSchema },
      { name: Redemption.name, schema: RedemptionSchema },
      { name: TokenLedger.name, schema: TokenLedgerSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
    ]),
  ],
  providers: [GamificationService],
  controllers: [GamificationController],
  exports: [GamificationService],
})
export class GamificationModule {}
