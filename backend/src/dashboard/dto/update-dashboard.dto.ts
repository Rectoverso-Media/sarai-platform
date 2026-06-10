import { IsString, IsOptional, IsBoolean, IsInt, Min, IsIn } from 'class-validator';

export class UpdateDashboardDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsInt()
  @Min(10)
  autoRefreshSeconds?: number | null;

  @IsOptional()
  @IsIn(['light', 'dark', 'midnight'])
  theme?: string;

  @IsOptional()
  widgets?: any;

  @IsOptional()
  layout?: any;
}
