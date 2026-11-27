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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AdminOrS2SGuard } from '../users/admin-or-s2s.guard';
import { UpdateCronJobDto, UpsertCronJobDto } from './dto/cron.dto';
import { CronService } from './cron.service';

interface S2SAnnotatedRequest extends Request {
  serviceConnection?: {
    slug: string;
  };
}

@ApiTags('cron')
@ApiBearerAuth()
@UseGuards(AdminOrS2SGuard)
@Controller('cron')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  private getCallerServiceSlug(req: S2SAnnotatedRequest): string | undefined {
    return req.serviceConnection?.slug;
  }

  @Get('status')
  @ApiOperation({ summary: 'Get Cron Broker configuration, folder naming, and available services' })
  async getStatus(@Req() req: S2SAnnotatedRequest) {
    return this.cronService.getStatus(this.getCallerServiceSlug(req));
  }

  @Get('folders')
  @ApiOperation({ summary: 'List managed cron-job.org folders cached in Central Gateway' })
  async listFolders(@Req() req: S2SAnnotatedRequest) {
    return this.cronService.listFolders(this.getCallerServiceSlug(req));
  }

  @Post('folders/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ensure folders exist on cron-job.org for all active Prism services and cache them',
  })
  async syncFolders(@Req() req: S2SAnnotatedRequest) {
    return this.cronService.syncFolders(this.getCallerServiceSlug(req));
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List registered cron jobs (scoped for S2S callers)' })
  async listJobs(@Req() req: S2SAnnotatedRequest) {
    return this.cronService.listJobs(this.getCallerServiceSlug(req));
  }

  @Post('jobs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register or update a cron job in the service-scoped folder on cron-job.org',
  })
  async upsertJob(@Req() req: S2SAnnotatedRequest, @Body() dto: UpsertCronJobDto) {
    return this.cronService.upsertJob(dto, this.getCallerServiceSlug(req));
  }

  @Patch('jobs/:id')
  @ApiOperation({ summary: 'Update a registered cron job (schedule, toggle enabled, or path)' })
  async updateJob(
    @Req() req: S2SAnnotatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCronJobDto,
  ) {
    return this.cronService.updateJob(id, dto, this.getCallerServiceSlug(req));
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Delete a cron job from cron-job.org and Central Gateway DB' })
  async deleteJob(@Req() req: S2SAnnotatedRequest, @Param('id') id: string) {
    return this.cronService.deleteJob(id, this.getCallerServiceSlug(req));
  }

  @Get('jobs/:id/history')
  @ApiOperation({ summary: 'Fetch recent execution history for a cron job from cron-job.org' })
  async getJobHistory(@Req() req: S2SAnnotatedRequest, @Param('id') id: string) {
    return this.cronService.getJobHistory(id, this.getCallerServiceSlug(req));
  }

  @Post('jobs/:id/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger a registered cron endpoint directly from Gateway for local/manual testing',
  })
  async triggerJobNow(@Req() req: S2SAnnotatedRequest, @Param('id') id: string) {
    return this.cronService.triggerJobNow(id, this.getCallerServiceSlug(req));
  }
}
