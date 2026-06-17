import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['PRO', 'ENTERPRISE'], { message: 'planName harus PRO atau ENTERPRISE' })
  planName: 'PRO' | 'ENTERPRISE';
}

export class IncrementUsageDto {
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @IsString()
  @IsIn(['QUERY', 'AI_TOKEN', 'AIRBYTE_SYNC'])
  metricType: 'QUERY' | 'AI_TOKEN' | 'AIRBYTE_SYNC';

  @IsNotEmpty()
  value: number;
}
