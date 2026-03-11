import { Module } from '@nestjs/common';
import { SeedController } from './seed.controller';
import { UsersModule } from '../modules/users/users.module';
import { ProgramModule } from '../modules/program/program.module';

@Module({
  imports: [UsersModule, ProgramModule],
  controllers: [SeedController],
})
export class SeedModule {}
