import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const ALLOWED_CRON_HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type CronHttpMethod = (typeof ALLOWED_CRON_HTTP_METHODS)[number];

export class CronScheduleDto {
  @ApiProperty({ example: 'Asia/Ho_Chi_Minh' })
  @IsString()
  @IsNotEmpty()
  timezone!: string;

  @ApiProperty({ example: [20], description: 'Hours (0-23) or [-1] for every hour' })
  @IsArray()
  @IsInt({ each: true })
  @Min(-1, { each: true })
  @Max(23, { each: true })
  hours!: number[];

  @ApiProperty({ example: [0], description: 'Minutes (0-59) or [-1] for every minute' })
  @IsArray()
  @IsInt({ each: true })
  @Min(-1, { each: true })
  @Max(59, { each: true })
  minutes!: number[];

  @ApiProperty({ example: [-1], description: 'Days of month (1-31) or [-1] for every day' })
  @IsArray()
  @IsInt({ each: true })
  @Min(-1, { each: true })
  @Max(31, { each: true })
  mdays!: number[];

  @ApiProperty({ example: [-1], description: 'Months (1-12) or [-1] for every month' })
  @IsArray()
  @IsInt({ each: true })
  @Min(-1, { each: true })
  @Max(12, { each: true })
  months!: number[];

  @ApiProperty({ example: [-1], description: 'Weekdays (0=Sun..6=Sat) or [-1] for every weekday' })
  @IsArray()
  @IsInt({ each: true })
  @Min(-1, { each: true })
  @Max(6, { each: true })
  wdays!: number[];

  @ApiPropertyOptional({ example: 0, description: 'Expiration timestamp (0 = never expires)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  expiresAt?: number;
}

export class UpsertCronJobDto {
  @ApiPropertyOptional({
    example: 'git-pulse',
    description: 'Target service slug (enforced automatically for S2S callers)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{1,62}$/)
  serviceSlug?: string;

  @ApiProperty({
    example: 'daily-standup-tick',
    description: 'Unique job key within the owning service',
  })
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-_]{1,78}$/, {
    message: 'jobKey must be lowercase alphanumeric with hyphens or underscores',
  })
  jobKey!: string;

  @ApiProperty({ example: 'Git Pulse Daily Standup Tick' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @ApiProperty({
    example: '/internal/cron/daily-standup',
    description: 'Relative endpoint path on the service (must start with /)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  endpointPath!: string;

  @ApiPropertyOptional({ enum: ALLOWED_CRON_HTTP_METHODS, default: 'POST' })
  @IsOptional()
  @IsIn(ALLOWED_CRON_HTTP_METHODS)
  httpMethod?: CronHttpMethod;

  @ApiProperty({ type: CronScheduleDto })
  @ValidateNested()
  @Type(() => CronScheduleDto)
  schedule!: CronScheduleDto;

  @ApiPropertyOptional({ default: 30, minimum: 1, maximum: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  timeoutSeconds?: number;

  @ApiPropertyOptional({
    description: 'Enable job immediately (defaults to false for localhost targets)',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  saveResponses?: boolean;

  @ApiPropertyOptional({
    example: { 'X-Cron-Secret': 'optional-secret' },
    description: 'Optional custom HTTP headers encrypted at rest in Gateway DB',
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;
}

export class UpdateCronJobDto {
  @ApiPropertyOptional({ example: 'Git Pulse Daily Standup Tick' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({ example: '/internal/cron/daily-standup' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  endpointPath?: string;

  @ApiPropertyOptional({ enum: ALLOWED_CRON_HTTP_METHODS })
  @IsOptional()
  @IsIn(ALLOWED_CRON_HTTP_METHODS)
  httpMethod?: CronHttpMethod;

  @ApiPropertyOptional({ type: CronScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CronScheduleDto)
  schedule?: CronScheduleDto;

  @ApiPropertyOptional({ minimum: 1, maximum: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  timeoutSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  saveResponses?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;
}
