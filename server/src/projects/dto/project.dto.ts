import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'my-service' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ example: 'My Service Platform' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Microservice or ecosystem module' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpsertChannelDto {
  @ApiProperty({ example: 'ci' })
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @ApiProperty({ example: 'C0CGL8EBFT2' })
  @IsString()
  @IsNotEmpty()
  channelId!: string;

  @ApiProperty({ example: '#ci-cd' })
  @IsString()
  @IsNotEmpty()
  channelName!: string;

  @ApiPropertyOptional({ example: 'slack', default: 'slack' })
  @IsString()
  @IsOptional()
  provider?: string;
}

export class UpdateProjectStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;
}
