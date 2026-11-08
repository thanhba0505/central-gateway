import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthAuthorizeDto {
  @ApiProperty({ example: 'wonderlab', description: 'Registered child application client ID' })
  @IsString()
  @IsNotEmpty()
  client_id!: string;

  @ApiProperty({
    example: 'https://wonderlab.io.vn/auth/callback',
    description: 'Whitelisted callback URL',
  })
  @IsString()
  @IsNotEmpty()
  redirect_uri!: string;

  @ApiProperty({ example: 'code', description: 'OAuth response type' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['code'])
  response_type!: string;

  @ApiProperty({
    example: 'xyz123State',
    required: false,
    description: 'Client state parameter to prevent CSRF',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    example: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    description: 'Base64URL SHA-256 PKCE Code Challenge',
  })
  @IsString()
  @IsNotEmpty()
  code_challenge!: string;

  @ApiProperty({ example: 'S256', required: false, description: 'PKCE challenge method' })
  @IsString()
  @IsOptional()
  @IsIn(['S256', 'plain'])
  code_challenge_method?: string;
}

export class OAuthTokenDto {
  @ApiProperty({ example: 'authorization_code', description: 'Grant type' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['authorization_code'])
  grant_type!: string;

  @ApiProperty({ example: 'wonderlab', description: 'Registered client ID' })
  @IsString()
  @IsNotEmpty()
  client_id!: string;

  @ApiProperty({ example: 'auth_code_hex_value', description: 'Single-use authorization code' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    description: 'PKCE Code Verifier',
  })
  @IsString()
  @IsNotEmpty()
  code_verifier!: string;
}
