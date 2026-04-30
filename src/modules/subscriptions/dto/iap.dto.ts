import { IsIn, IsOptional, IsString } from 'class-validator';

export class VerifyAppleReceiptDto {
  @IsString()
  receipt: string; // base64

  @IsString()
  productId: string;

  @IsIn(['30-day-recharge'])
  product: '30-day-recharge';
}

export class VerifyGooglePurchaseDto {
  @IsString()
  purchaseToken: string;

  @IsString()
  productId: string;

  @IsIn(['30-day-recharge'])
  product: '30-day-recharge';

  @IsOptional()
  @IsString()
  orderId?: string;
}
