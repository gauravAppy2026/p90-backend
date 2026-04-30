import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PurchaseRecord,
  PurchaseRecordSchema,
} from './schemas/purchase-record.schema';
import { UnlockCode, UnlockCodeSchema } from './schemas/unlock-code.schema';
import { MonthCycle, MonthCycleSchema } from './schemas/month-cycle.schema';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseRecord.name, schema: PurchaseRecordSchema },
      { name: UnlockCode.name, schema: UnlockCodeSchema },
      { name: MonthCycle.name, schema: MonthCycleSchema },
    ]),
  ],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
