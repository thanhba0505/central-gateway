import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpsertChannelDto, UpdateProjectStatusDto } from './dto/project.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all connected projects with their mapped channels' })
  async listProjects() {
    return this.prisma.project.findMany({
      include: {
        channels: {
          orderBy: { eventType: 'asc' },
        },
        _count: {
          select: { logs: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Register a new project in Central Gateway' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async createProject(@Body() dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        slug: dto.slug.toLowerCase().trim(),
        name: dto.name.trim(),
        description: dto.description?.trim(),
      },
      include: {
        channels: true,
        _count: { select: { logs: true } },
      },
    });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Toggle project active status' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateProjectStatusDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project not found with id: ${id}`);
    }
    return this.prisma.project.update({
      where: { id },
      data: { isActive: dto.isActive },
    });
  }

  @Put(':id/channels')
  @ApiOperation({ summary: 'Upsert channel mapping for a project and event type' })
  async upsertChannel(@Param('id') id: string, @Body() dto: UpsertChannelDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project not found with id: ${id}`);
    }

    const provider = dto.provider || 'slack';
    const eventType = dto.eventType.toLowerCase().trim();

    return this.prisma.channelMapping.upsert({
      where: {
        projectId_eventType_provider: {
          projectId: id,
          eventType,
          provider,
        },
      },
      update: {
        channelId: dto.channelId.trim(),
        channelName: dto.channelName.trim(),
      },
      create: {
        projectId: id,
        eventType,
        provider,
        channelId: dto.channelId.trim(),
        channelName: dto.channelName.trim(),
      },
    });
  }

  @Delete(':id/channels/:mappingId')
  @ApiOperation({ summary: 'Delete a channel mapping' })
  async deleteChannel(@Param('id') id: string, @Param('mappingId') mappingId: string) {
    return this.prisma.channelMapping.deleteMany({
      where: {
        id: mappingId,
        projectId: id,
      },
    });
  }

  @Get(':slug/logs')
  @ApiOperation({ summary: 'Get recent dispatch logs for a project' })
  async getProjectLogs(@Param('slug') slug: string) {
    return this.prisma.dispatchLog.findMany({
      where: { project: { slug } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
