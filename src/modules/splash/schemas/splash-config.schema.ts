import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SplashConfigDocument = SplashConfig & Document;

// One singleton config doc per environment. The singleton is enforced
// by the service (always upserting / reading the first record).
@Schema({ timestamps: true })
export class SplashConfig {
  @Prop({ default: 'The 30-Day Recharge', maxlength: 120 })
  appName: string;

  @Prop({ default: 'Hosted by The Living Food Mission', maxlength: 200 })
  tagline: string;

  @Prop({ maxlength: 500, default: 'Dedicated to inspiring global change toward understanding our bodies and inspiring those around us.' })
  missionStatement: string;

  // Optional hero image (overrides the default leaf logo).
  @Prop()
  heroImageUrl?: string;

  @Prop({ type: Object, default: () => ({}) })
  modules: {
    quickStart?: ModuleConfig;
    thirtyDay?: ModuleConfig;
    allIn?: ModuleConfig;
  };
}

export interface ModuleConfig {
  title: string;
  description: string;
  badge: string;
  moreInfoUrl?: string;
  isActive: boolean;
}

export const SplashConfigSchema = SchemaFactory.createForClass(SplashConfig);
