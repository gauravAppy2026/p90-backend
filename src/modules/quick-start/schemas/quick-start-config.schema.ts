import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuickStartConfigDocument = QuickStartConfig & Document;

// Singleton config doc — page-level intro text shown above the video list
// in the mobile Quick Start screen and editable from the admin panel.
@Schema({ timestamps: true })
export class QuickStartConfig {
  @Prop({
    maxlength: 4000,
    default:
      'Free intro videos to help you get started — what PEMF is, how to use the device, and a welcome from The Living Food Mission.',
  })
  introText: string;
}

export const QuickStartConfigSchema = SchemaFactory.createForClass(QuickStartConfig);
