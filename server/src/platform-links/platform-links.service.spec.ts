import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformLinksService } from './platform-links.service';

describe('PlatformLinksService', () => {
  let service: PlatformLinksService;
  let prismaMock: {
    platformLink: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      platformLink: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new PlatformLinksService(prismaMock as unknown as PrismaService);
  });

  it('rejects non-http(s) URLs such as javascript: to prevent XSS', async () => {
    await expect(
      service.create({
        title: 'Bad Link',
        category: 'infra',
        url: 'javascript:alert(1)',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('auto-generates slug from Vietnamese title and creates link', async () => {
    prismaMock.platformLink.create.mockImplementation(async ({ data }) => ({
      id: 'link-1',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const created = await service.create({
      title: 'Cổng Tên Miền Cloudflare',
      category: 'infra',
      url: 'https://dash.cloudflare.com',
      accountNote: 'Mail chính',
    });

    expect(created.slug).toBe('cong-ten-mien-cloudflare');
    expect(created.url).toBe('https://dash.cloudflare.com');
    expect(created.accountNote).toBe('Mail chính');
  });

  it('throws ConflictException when slug already exists', async () => {
    prismaMock.platformLink.findUnique.mockResolvedValueOnce({ id: 'existing' });

    await expect(
      service.create({
        slug: 'vercel-dashboard',
        title: 'Vercel',
        category: 'infra',
        url: 'https://vercel.com',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('updates link and clears secondaryUrl when set to empty string', async () => {
    prismaMock.platformLink.findUnique.mockResolvedValueOnce({
      id: 'link-1',
      slug: 'vercel-dashboard',
      title: 'Vercel',
      category: 'infra',
      url: 'https://vercel.com',
      secondaryUrl: 'https://vercel.com/docs',
      secondaryLabel: 'Docs',
      description: 'Old',
      accountNote: null,
      environment: 'PRODUCTION',
      sortOrder: 10,
      isActive: true,
    });
    prismaMock.platformLink.update.mockImplementation(async ({ data }) => ({
      id: 'link-1',
      slug: 'vercel-dashboard',
      ...data,
    }));

    const updated = await service.update('link-1', {
      title: 'Vercel Dashboard',
      secondaryUrl: '',
      secondaryLabel: '',
      accountNote: 'Updated note',
    });

    expect(updated.title).toBe('Vercel Dashboard');
    expect(updated.secondaryUrl).toBeNull();
    expect(updated.secondaryLabel).toBeNull();
    expect(updated.accountNote).toBe('Updated note');
  });

  it('throws NotFoundException when deleting unknown id', async () => {
    prismaMock.platformLink.findUnique.mockResolvedValueOnce(null);
    await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
  });
});
