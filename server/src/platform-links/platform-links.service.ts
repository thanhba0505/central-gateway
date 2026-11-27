import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlatformLink } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlatformLinkDto, UpdatePlatformLinkDto } from './dto/platform-link.dto';

@Injectable()
export class PlatformLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(category?: string, search?: string): Promise<PlatformLink[]> {
    const trimmedSearch = search?.trim();
    const trimmedCategory = category?.trim();

    return this.prisma.platformLink.findMany({
      where: {
        ...(trimmedCategory && trimmedCategory !== 'all' ? { category: trimmedCategory } : {}),
        ...(trimmedSearch
          ? {
              OR: [
                { title: { contains: trimmedSearch, mode: 'insensitive' } },
                { description: { contains: trimmedSearch, mode: 'insensitive' } },
                { accountNote: { contains: trimmedSearch, mode: 'insensitive' } },
                { url: { contains: trimmedSearch, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  async create(dto: CreatePlatformLinkDto): Promise<PlatformLink> {
    const url = this.validateHttpUrl(dto.url, 'url');
    const secondaryUrl = dto.secondaryUrl
      ? this.validateHttpUrl(dto.secondaryUrl, 'secondaryUrl')
      : null;

    const slug = dto.slug?.trim().toLowerCase() || this.slugify(dto.title);
    const existing = await this.prisma.platformLink.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Platform link with slug '${slug}' already exists`);
    }

    return this.prisma.platformLink.create({
      data: {
        slug,
        title: dto.title.trim(),
        category: dto.category,
        url,
        secondaryUrl,
        secondaryLabel: dto.secondaryLabel?.trim() || null,
        description: dto.description?.trim() || null,
        accountNote: dto.accountNote?.trim() || null,
        environment: dto.environment ?? 'ALL',
        sortOrder: dto.sortOrder ?? 50,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdatePlatformLinkDto): Promise<PlatformLink> {
    const existing = await this.prisma.platformLink.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Platform link not found: ${id}`);
    }

    const url = dto.url !== undefined ? this.validateHttpUrl(dto.url, 'url') : existing.url;
    const secondaryUrl =
      dto.secondaryUrl === undefined
        ? existing.secondaryUrl
        : dto.secondaryUrl && dto.secondaryUrl.trim().length > 0
          ? this.validateHttpUrl(dto.secondaryUrl, 'secondaryUrl')
          : null;

    return this.prisma.platformLink.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : existing.title,
        category: dto.category ?? existing.category,
        url,
        secondaryUrl,
        secondaryLabel:
          dto.secondaryLabel !== undefined
            ? dto.secondaryLabel?.trim() || null
            : existing.secondaryLabel,
        description:
          dto.description !== undefined ? dto.description?.trim() || null : existing.description,
        accountNote:
          dto.accountNote !== undefined ? dto.accountNote?.trim() || null : existing.accountNote,
        environment: dto.environment ?? existing.environment,
        sortOrder: dto.sortOrder ?? existing.sortOrder,
        isActive: dto.isActive ?? existing.isActive,
      },
    });
  }

  async remove(id: string): Promise<{ deleted: true; id: string }> {
    const existing = await this.prisma.platformLink.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Platform link not found: ${id}`);
    }

    await this.prisma.platformLink.delete({ where: { id } });
    return { deleted: true, id };
  }

  private validateHttpUrl(rawUrl: string, fieldName: string): string {
    const trimmed = rawUrl.trim();
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new BadRequestException(`${fieldName} must use http or https protocol`);
      }
      return parsed.toString().replace(/\/$/, trimmed.endsWith('/') ? '/' : '');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`${fieldName} must be a valid URL`);
    }
  }

  private slugify(title: string): string {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);

    return base.length >= 2 ? base : `link-${Date.now()}`;
  }
}
