import { Controller, Get, Post, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectStatusDto } from './dto/project.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered projects in Central Gateway' })
  async listProjects() {
    return this.prisma.project.findMany({
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
}
