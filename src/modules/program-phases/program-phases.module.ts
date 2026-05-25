import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProgramPhase,
  ProgramPhaseSchema,
} from './schemas/program-phase.schema';
import { ProgramPhasesService } from './program-phases.service';
import { ProgramPhasesController } from './program-phases.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProgramPhase.name, schema: ProgramPhaseSchema },
    ]),
  ],
  providers: [ProgramPhasesService],
  controllers: [ProgramPhasesController],
  exports: [ProgramPhasesService],
})
export class ProgramPhasesModule {}
