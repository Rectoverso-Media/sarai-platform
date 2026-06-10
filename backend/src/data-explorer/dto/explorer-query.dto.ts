import { IsString, IsOptional, IsInt, Min, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterConditionDto {
  @IsString()
  column: string;

  @IsString()
  @IsIn(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'isNull', 'isNotNull'])
  operator: string;

  @IsOptional()
  value?: any;
}

export class SortConditionDto {
  @IsString()
  column: string;

  @IsString()
  @IsIn(['asc', 'desc'])
  direction: 'asc' | 'desc';
}

export class ExplorerQueryDto {
  @IsString()
  @IsIn(['synced_data', 'managed_table', 'query_execution'])
  tableSource: string;

  @IsOptional()
  @IsString()
  tableName?: string; // stream name (untuk synced_data) atau table name (untuk managed_table)

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionDto)
  filters?: FilterConditionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortConditionDto)
  sorts?: SortConditionDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}
