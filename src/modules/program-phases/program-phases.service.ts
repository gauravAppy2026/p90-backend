import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProgramPhase,
  ProgramPhaseDocument,
} from './schemas/program-phase.schema';
import {
  CreateProgramPhaseDto,
  UpdateProgramPhaseDto,
} from './dto/program-phase.dto';

// Seeded on first boot if no phases exist. Matches the client's
// Foundation / Activation / Alignment / Integration arc from her
// May 25 design boards. Admin can edit / rename / re-range freely
// afterwards.
const DEFAULT_PHASES = [
  { name: 'Foundation', subtitle: 'Build the base', dayStart: 1, dayEnd: 10, order: 1 },
  { name: 'Activation', subtitle: 'Increase your flow', dayStart: 11, dayEnd: 20, order: 2 },
  { name: 'Alignment', subtitle: 'Refine and stabilize', dayStart: 21, dayEnd: 25, order: 3 },
  { name: 'Integration', subtitle: 'Live your life in charge', dayStart: 26, dayEnd: 30, order: 4 },
];

@Injectable()
export class ProgramPhasesService implements OnModuleInit {
  constructor(
    @InjectModel(ProgramPhase.name)
    private readonly model: Model<ProgramPhaseDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.model.countDocuments();
    if (count === 0) {
      await this.model.insertMany(DEFAULT_PHASES.map((p) => ({ ...p, isActive: true })));
    }
  }

  // Public — only active phases.
  async listActive(): Promise<ProgramPhaseDocument[]> {
    return this.model.find({ isActive: true }).sort({ order: 1, dayStart: 1 });
  }

  // Admin — all phases.
  async listAll(): Promise<ProgramPhaseDocument[]> {
    return this.model.find().sort({ order: 1, dayStart: 1 });
  }

  async create(data: CreateProgramPhaseDto): Promise<ProgramPhaseDocument> {
    return this.model.create({ ...data, isActive: data.isActive ?? true });
  }

  async update(id: string, data: UpdateProgramPhaseDto): Promise<ProgramPhaseDocument> {
    const updated = await this.model.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new NotFoundException('Phase not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.model.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Phase not found');
  }
}
