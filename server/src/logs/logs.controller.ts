import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('logs')
@Controller('logs')
export class LogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List recent dispatch logs across all projects with analytics' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'project', required: false, type: String })
  @ApiQuery({ name: 'eventType', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getLogs(
    @Query('limit') limitStr?: string,
    @Query('page') pageStr?: string,
    @Query('project') project?: string,
    @Query('eventType') eventType?: string,
    @Query('status') status?: string,
  ) {
    const limit = Math.min(Math.max(parseInt(limitStr || '50', 10) || 50, 1), 200);
    const page = Math.max(parseInt(pageStr || '1', 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (project) {
      where.project = { slug: project };
    }
    if (eventType) {
      where.eventType = eventType;
    }
    if (status) {
      where.status = status.toUpperCase();
    }

    const [items, total, successCount, failCount] = await Promise.all([
      this.prisma.dispatchLog.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.dispatchLog.count({ where }),
      this.prisma.dispatchLog.count({ where: { ...where, status: 'SUCCESS' } }),
      this.prisma.dispatchLog.count({ where: { ...where, status: 'FAIL' } }),
    ]);

    const successRate = total > 0 ? Number(((successCount / total) * 100).toFixed(1)) : 100;

    return {
      items,
      total,
      page,
      limit,
      stats: {
        total,
        successCount,
        failCount,
        successRate,
      },
    };
  }
}
