import { IsIn, IsOptional } from 'class-validator';

export class InviteFreeAccessDto {
  // Which product the gifted unlock code grants. Defaults to the program
  // ("30-day-recharge") — the natural "keep going for free" invite.
  @IsOptional()
  @IsIn(['all-in', '30-day-recharge'])
  product?: 'all-in' | '30-day-recharge';
}
