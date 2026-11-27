import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const PLATFORM_LINK_CATEGORIES = [
  'apps',
  'infra',
  'source',
  'auth_notify',
  'ai_standup',
  'planned',
] as const;
export type PlatformLinkCategory = (typeof PLATFORM_LINK_CATEGORIES)[number];

export const PLATFORM_LINK_ENVIRONMENTS = ['ALL', 'PRODUCTION', 'LOCAL'] as const;
export type PlatformLinkEnvironment = (typeof PLATFORM_LINK_ENVIRONMENTS)[number];

export class CreatePlatformLinkDto {
  @ApiPropertyOptional({
    example: 'cloudflare-dns',
    description: 'Unique slug identifier (auto-generated from title if omitted)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{1,78}$/, {
    message: 'slug must be lowercase alphanumeric with hyphens',
  })
  slug?: string;

  @ApiProperty({ example: 'Cloudflare DNS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ enum: PLATFORM_LINK_CATEGORIES, example: 'infra' })
  @IsIn(PLATFORM_LINK_CATEGORIES)
  category!: PlatformLinkCategory;

  @ApiProperty({ example: 'https://dash.cloudflare.com' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(512)
  url!: string;

  @ApiPropertyOptional({ example: 'https://developers.cloudflare.com' })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(512)
  secondaryUrl?: string | null;

  @ApiPropertyOptional({ example: 'API Docs' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  secondaryLabel?: string | null;

  @ApiPropertyOptional({ example: 'DNS & domain routing for wonderlab.io.vn' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string | null;

  @ApiPropertyOptional({ example: 'Account: admin@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  accountNote?: string | null;

  @ApiPropertyOptional({ enum: PLATFORM_LINK_ENVIRONMENTS, default: 'ALL' })
  @IsOptional()
  @IsIn(PLATFORM_LINK_ENVIRONMENTS)
  environment?: PlatformLinkEnvironment;

  @ApiPropertyOptional({ default: 50, minimum: 0, maximum: 9999 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlatformLinkDto {
  @ApiPropertyOptional({ example: 'Cloudflare DNS' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ enum: PLATFORM_LINK_CATEGORIES })
  @IsOptional()
  @IsIn(PLATFORM_LINK_CATEGORIES)
  category?: PlatformLinkCategory;

  @ApiPropertyOptional({ example: 'https://dash.cloudflare.com' })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(512)
  url?: string;

  @ApiPropertyOptional({ example: 'https://developers.cloudflare.com' })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(512)
  secondaryUrl?: string | null;

  @ApiPropertyOptional({ example: 'API Docs' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  secondaryLabel?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  accountNote?: string | null;

  @ApiPropertyOptional({ enum: PLATFORM_LINK_ENVIRONMENTS })
  @IsOptional()
  @IsIn(PLATFORM_LINK_ENVIRONMENTS)
  environment?: PlatformLinkEnvironment;

  @ApiPropertyOptional({ minimum: 0, maximum: 9999 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
