import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProgramPhaseDocument = ProgramPhase & Document;

// Phases group the 30 days into a narrative arc — defaults seeded on
// first boot are Foundation (1-10), Activation (11-20), Alignment
// (21-25), Integration (26-30). Admin can rename, re-range, or add
// extra phases via the admin panel.
@Schema({ timestamps: true })
export class ProgramPhase {
  @Prop({ required: true, maxlength: 60 })
  name: string;

  @Prop({ maxlength: 120 })
  subtitle: string;

  @Prop({ required: true, min: 1, max: 30 })
  dayStart: number;

  @Prop({ required: true, min: 1, max: 30 })
  dayEnd: number;

  // Circular landscape image displayed on the program-overview card.
  @Prop()
  imageUrl?: string;

  @Prop({ required: true, default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProgramPhaseSchema = SchemaFactory.createForClass(ProgramPhase);
ProgramPhaseSchema.index({ order: 1 });
