import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuickStartVideoDocument = QuickStartVideo & Document;

// Videos shown in the "Quick Start" module on the splash screen.
// 3 planned at launch: PEMF/terahertz explainer, how-to-use, welcome from
// The Living Food Mission. Admin uploads .mp4 to R2 (via the existing
// /api/upload pipeline) and stores the resulting URL here.
@Schema({ timestamps: true })
export class QuickStartVideo {
  @Prop({ required: true, maxlength: 120 })
  title: string;

  @Prop({ maxlength: 1000 })
  description?: string;

  // R2 public URL — stored as-is; we don't re-host or transcode.
  @Prop({ required: true })
  videoUrl: string;

  // Optional poster/thumbnail also on R2.
  @Prop()
  thumbnailUrl?: string;

  @Prop({ default: 0 })
  durationSeconds?: number;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const QuickStartVideoSchema = SchemaFactory.createForClass(QuickStartVideo);
QuickStartVideoSchema.index({ isActive: 1, order: 1 });
