import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService, SafeUser, PaginatedUsersResult } from './users.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { AdminOrS2SGuard } from './admin-or-s2s.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(AdminOrS2SGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users in the Prism ecosystem with pagination and search' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of users' })
  async listUsers(@Query() query: ListUsersQueryDto): Promise<PaginatedUsersResult> {
    return this.usersService.findAll(query);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle user active/inactive status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Updated user' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto): Promise<SafeUser> {
    return this.usersService.updateStatus(id, dto.isActive);
  }

  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user role (ADMIN / USER)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Updated user' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto): Promise<SafeUser> {
    return this.usersService.updateRole(id, dto.role);
  }

  @Patch(':id/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user username and/or email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Updated user' })
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<SafeUser> {
    return this.usersService.updateProfile(id, dto);
  }
}
