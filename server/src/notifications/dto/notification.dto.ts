import { IsString, IsNotEmpty, IsOptional, IsIn, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendDeployNotificationDto {
  @ApiProperty({ example: 'wonderlab' })
  @IsString()
  @IsNotEmpty()
  project!: string;

  @ApiProperty({ example: 'STARTED', enum: ['STARTED', 'SUCCESS', 'FAIL'] })
  @IsIn(['STARTED', 'SUCCESS', 'FAIL'])
  status!: 'STARTED' | 'SUCCESS' | 'FAIL';

  @ApiProperty({ example: 'v0.15.0' })
  @IsString()
  @IsNotEmpty()
  version!: string;

  @ApiProperty({ example: '14be73785c05a01665b7f80b821c4ec77bc2f1f3' })
  @IsString()
  @IsNotEmpty()
  commit!: string;

  @ApiProperty({ example: 'Production' })
  @IsString()
  @IsNotEmpty()
  target!: string;

  @ApiPropertyOptional({ example: 'thanhba0505' })
  @IsString()
  @IsOptional()
  actor?: string;

  @ApiPropertyOptional({ example: 'https://wonderlab.io.vn' })
  @IsString()
  @IsOptional()
  appUrl?: string;

  @ApiPropertyOptional({ example: 'https://wonderlab.io.vn/health' })
  @IsString()
  @IsOptional()
  healthUrl?: string;

  @ApiPropertyOptional({ example: 'https://github.com/thanhba0505/wonderlab/actions/runs/12345' })
  @IsString()
  @IsOptional()
  runUrl?: string;
}

export class SendCiNotificationDto {
  @ApiProperty({ example: 'wonderlab' })
  @IsString()
  @IsNotEmpty()
  project!: string;

  @ApiProperty({ example: 'SUCCESS', enum: ['SUCCESS', 'FAIL'] })
  @IsIn(['SUCCESS', 'FAIL'])
  status!: 'SUCCESS' | 'FAIL';

  @ApiProperty({ example: 'develop' })
  @IsString()
  @IsNotEmpty()
  branch!: string;

  @ApiProperty({ example: '14be737' })
  @IsString()
  @IsNotEmpty()
  commit!: string;

  @ApiPropertyOptional({ example: 'push by @thanhba0505' })
  @IsString()
  @IsOptional()
  trigger?: string;

  @ApiProperty({
    example: {
      'Quality & Types': 'SUCCESS',
      'Unit Tests': 'SUCCESS',
      'E2E DB Tests': 'SUCCESS',
      'Production Build': 'SUCCESS',
    },
  })
  @IsObject()
  pipeline!: Record<string, string>;

  @ApiPropertyOptional({ example: 'https://github.com/thanhba0505/wonderlab/actions' })
  @IsString()
  @IsOptional()
  runUrl?: string;
}

export class SendCommunityNotificationDto {
  @ApiProperty({ example: 'wonderlab' })
  @IsString()
  @IsNotEmpty()
  project!: string;

  @ApiProperty({ example: 'feedback', enum: ['feedback', 'comment'] })
  @IsIn(['feedback', 'comment'])
  type!: 'feedback' | 'comment';

  @ApiProperty({ example: "Schrödinger's Cat" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  @IsNotEmpty()
  author!: string;

  @ApiProperty({ example: 'Nội dung mô tả hoặc bình luận' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ example: 'Quantum Mechanics' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'https://wonderlab.io.vn/requests' })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({ example: 'https://wonderlab.io.vn/admin/requests' })
  @IsString()
  @IsOptional()
  adminUrl?: string;
}

export class SendTestNotificationDto {
  @ApiProperty({ example: 'wonderlab' })
  @IsString()
  @IsNotEmpty()
  project!: string;

  @ApiPropertyOptional({ example: 'ci' })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({ example: 'C0CGL8EBFT2' })
  @IsOptional()
  @IsString()
  channelId?: string;

  @ApiProperty({ example: 'This is a test notification from Central Gateway Console.' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}
