import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class GenerateCodesDto {
  @IsInt()
  @Min(1)
  @Max(500)
  count: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;

  @IsOptional()
  expiresAt?: string; // ISO date
}

export class RedeemCodeDto {
  @IsString()
  @MaxLength(20)
  code: string;
}
