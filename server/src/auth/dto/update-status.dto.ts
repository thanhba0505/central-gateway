import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({ example: false, description: 'Active status of the user account' })
  @IsBoolean()
  isActive!: boolean;
}
