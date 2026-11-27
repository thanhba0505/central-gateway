import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminOrS2SGuard } from '../users/admin-or-s2s.guard';
import { CreatePlatformLinkDto, UpdatePlatformLinkDto } from './dto/platform-link.dto';
import { PlatformLinksService } from './platform-links.service';

@ApiTags('platform-links')
@ApiBearerAuth()
@UseGuards(AdminOrS2SGuard)
@Controller('platform-links')
export class PlatformLinksController {
  constructor(private readonly platformLinksService: PlatformLinksService) {}

  @Get()
  @ApiOperation({ summary: 'List all platform & external service directory links' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listAll(@Query('category') category?: string, @Query('search') search?: string) {
    return this.platformLinksService.listAll(category, search);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new platform directory link' })
  async create(@Body() dto: CreatePlatformLinkDto) {
    return this.platformLinksService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing platform directory link' })
  async update(@Param('id') id: string, @Body() dto: UpdatePlatformLinkDto) {
    return this.platformLinksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a platform directory link' })
  async remove(@Param('id') id: string) {
    return this.platformLinksService.remove(id);
  }
}
