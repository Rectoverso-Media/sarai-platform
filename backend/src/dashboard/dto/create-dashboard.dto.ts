import { IsString, IsOptional, IsBoolean, IsInt, Min, IsIn } from 'class-validator';

export class CreateDashboardDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsInt()
  @Min(10)
  autoRefreshSeconds?: number;

  @IsOptional()
  @IsIn(['light', 'dark', 'midnight'])
  theme?: string;
}
