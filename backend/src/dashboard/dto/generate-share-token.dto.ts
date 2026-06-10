import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class GenerateShareTokenDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiryDays?: number; // Default 30 hari jika tidak diisi
}
