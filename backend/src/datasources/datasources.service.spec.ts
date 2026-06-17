import { Test, TestingModule } from '@nestjs/testing';
import { DatasourcesService } from './datasources.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException, NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  dataSource: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('DatasourcesService', () => {
  let service: DatasourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatasourcesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DatasourcesService>(DatasourcesService);
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createDataSource() ───────────────────────────────────────────────────

  describe('createDataSource()', () => {
    const createDto = {
      name: 'Google Analytics Test',
      type: 'google_analytics',
      connectorId: 'ga4-connector',
    };

    it('should membuat data source baru dengan trial 14 hari', async () => {
      const now = new Date();
      const expectedExpiry = new Date(now);
      expectedExpiry.setDate(expectedExpiry.getDate() + 14);

      mockPrismaService.dataSource.create.mockResolvedValue({
        id: 'ds-1',
        name: createDto.name,
        isTrialActive: true,
        trialStartsAt: now,
        trialEndsAt: expectedExpiry,
      });

      const result = await service.createDataSource(createDto);

      expect(result.message).toContain('Trial 14 Hari');
      expect(result.data).toHaveProperty('id', 'ds-1');
      expect(mockPrismaService.dataSource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: createDto.name,
            isTrialActive: true,
            status: 'Connected',
          }),
        }),
      );
    });

    it('should throw HttpException jika prisma create gagal', async () => {
      mockPrismaService.dataSource.create.mockRejectedValue(new Error('DB Error'));

      await expect(service.createDataSource(createDto)).rejects.toThrow(HttpException);
    });
  });

  // ─── getAllDataSources() ───────────────────────────────────────────────────

  describe('getAllDataSources()', () => {
    it('should return daftar semua data source', async () => {
      const mockSources = [
        { id: 'ds-1', name: 'Source 1' },
        { id: 'ds-2', name: 'Source 2' },
      ];
      mockPrismaService.dataSource.findMany.mockResolvedValue(mockSources);

      const result = await service.getAllDataSources();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('ds-1');
    });

    it('should throw HttpException jika query gagal', async () => {
      mockPrismaService.dataSource.findMany.mockRejectedValue(new Error('DB Error'));

      await expect(service.getAllDataSources()).rejects.toThrow(HttpException);
    });
  });

  // ─── getDataSourceById() ──────────────────────────────────────────────────

  describe('getDataSourceById()', () => {
    it('should throw NotFoundException jika data source tidak ditemukan', async () => {
      mockPrismaService.dataSource.findUnique.mockResolvedValue(null);

      await expect(service.getDataSourceById('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return data source dengan trialDaysLeft', async () => {
      const futureDate = new Date(Date.now() + 7 * 86400000); // 7 hari dari sekarang
      mockPrismaService.dataSource.findUnique.mockResolvedValue({
        id: 'ds-1',
        name: 'Test Source',
        isTrialActive: true,
        trialEndsAt: futureDate,
        status: 'Connected',
      });

      const result = await service.getDataSourceById('ds-1');

      expect(result.data).toHaveProperty('trialDaysLeft');
      expect(result.data.trialDaysLeft).toBeGreaterThan(0);
      expect(result.data.trialDaysLeft).toBeLessThanOrEqual(7);
    });

    it('should return trialDaysLeft=null jika isTrialActive=false', async () => {
      mockPrismaService.dataSource.findUnique.mockResolvedValue({
        id: 'ds-1',
        name: 'Test Source',
        isTrialActive: false,
        trialEndsAt: null,
        status: 'Connected',
      });

      const result = await service.getDataSourceById('ds-1');

      expect(result.data.trialDaysLeft).toBeNull();
    });
  });

  // ─── updateDataSource() ───────────────────────────────────────────────────

  describe('updateDataSource()', () => {
    it('should throw NotFoundException jika data source tidak ada', async () => {
      mockPrismaService.dataSource.findUnique.mockResolvedValue(null);

      await expect(service.updateDataSource('non-existent', { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update nama data source', async () => {
      const existing = { id: 'ds-1', name: 'Old Name', status: 'Connected' };
      mockPrismaService.dataSource.findUnique.mockResolvedValue(existing);
      mockPrismaService.dataSource.update.mockResolvedValue({ ...existing, name: 'New Name' });

      const result = await service.updateDataSource('ds-1', { name: 'New Name' });

      expect(result.data.name).toBe('New Name');
      expect(mockPrismaService.dataSource.update).toHaveBeenCalledTimes(1);
    });
  });

  // ─── deleteDataSource() ───────────────────────────────────────────────────

  describe('deleteDataSource()', () => {
    it('should throw HttpException jika data source tidak ditemukan', async () => {
      mockPrismaService.dataSource.findUnique.mockResolvedValue(null);

      await expect(service.deleteDataSource('non-existent')).rejects.toThrow(HttpException);
    });

    it('should berhasil hapus data source', async () => {
      mockPrismaService.dataSource.findUnique.mockResolvedValue({ id: 'ds-1', name: 'Source' });
      mockPrismaService.dataSource.delete.mockResolvedValue({ id: 'ds-1' });

      const result = await service.deleteDataSource('ds-1');

      expect(result.message).toContain('dihapus');
      expect(mockPrismaService.dataSource.delete).toHaveBeenCalledWith({ where: { id: 'ds-1' } });
    });
  });
});
