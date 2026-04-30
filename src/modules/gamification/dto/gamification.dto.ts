import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { RULE_KEYS } from '../schemas/gamification-rule.schema';
import type { RuleKey } from '../schemas/gamification-rule.schema';
import type { RedemptionKind } from '../schemas/redemption-option.schema';

export class UpdateRuleDto {
  @IsInt()
  @Min(0)
  tokens: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateRedemptionOptionDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(1)
  tokenCost: number;

  @IsIn(['charity', 'retreat-discount', 'merch', 'consult', 'other'])
  kind: RedemptionKind;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateRedemptionOptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  tokenCost?: number;

  @IsOptional()
  @IsIn(['charity', 'retreat-discount', 'merch', 'consult', 'other'])
  kind?: RedemptionKind;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class RedeemDto {
  @IsString()
  optionId: string;
}

export class FulfillRedemptionDto {
  @IsIn(['fulfilled', 'cancelled'])
  status: 'fulfilled' | 'cancelled';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export const ALL_RULE_KEYS = RULE_KEYS;
export type { RuleKey };
