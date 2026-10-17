import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SetCacheDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsNotEmpty()
  value: any;

  @IsNumber()
  @IsOptional()
  ttlSeconds?: number;
}
