import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiPropertyOptional({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
    description: 'Google ID token (credential) from Google Identity Services',
  })
  @IsOptional()
  @IsString()
  credential?: string;

  @ApiPropertyOptional({
    description: 'Email (development simulation or direct payload)',
    example: 'admin@wonderlab.local',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Full name from Google profile',
    example: 'Admin User',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Google Subject ID (sub)',
    example: 'google_sub_10928301928301298',
  })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL from Google profile',
    example: 'https://lh3.googleusercontent.com/...',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
