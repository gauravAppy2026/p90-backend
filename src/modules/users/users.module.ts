import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ProgramModule } from '../program/program.module';
import { TrackerModule } from '../tracker/tracker.module';
import { ChecklistModule } from '../checklist/checklist.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => ProgramModule),
    forwardRef(() => TrackerModule),
    forwardRef(() => ChecklistModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
