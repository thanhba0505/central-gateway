import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all connected projects with their mapped channels' })
  async listProjects() {
    return this.prisma.project.findMany({
      include: {
        channels: true,
        _count: {
          select: { logs: true },
        },
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
