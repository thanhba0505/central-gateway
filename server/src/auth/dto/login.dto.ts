import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Username or account identifier' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Account password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: true, required: false, description: 'Persist session long-term' })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}
