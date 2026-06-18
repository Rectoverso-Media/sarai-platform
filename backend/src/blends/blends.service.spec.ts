import { Test, TestingModule } from '@nestjs/testing';
import { BlendsService, JoinType } from './blends.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('BlendsService', () => {
  let service: BlendsService;
  let prisma: PrismaService;

  const mockPrisma = {
    blend: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlendsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BlendsService>(BlendsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── createBlend ─────────────────────────────────────────────────────────

  describe('createBlend', () => {
    it('should throw if less than 2 sources', async () => {
      await expect(
        service.createBlend({
          name: 'Test Blend',
          joinType: 'INNER',
          sources: [{ dataSourceId: '1', streamName: 'stream1', joinKey: 'id' }],
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should create blend with 2+ sources', async () => {
      const mockBlend = {
        id: 'blend-1',
        name: 'Test Blend',
        joinType: 'INNER',
        sources: [
          { id: 's1', dataSourceId: 'ds1', joinKey: 'id' },
          { id: 's2', dataSourceId: 'ds2', joinKey: 'id' },
        ],
      };

      mockPrisma.blend.create.mockResolvedValue(mockBlend);

      const result = await service.createBlend({
        name: 'Test Blend',
        joinType: 'INNER',
        sources: [
          { dataSourceId: 'ds1', streamName: 'stream1', joinKey: 'id' },
          { dataSourceId: 'ds2', streamName: 'stream2', joinKey: 'id' },
        ],
      });

      expect(result.message).toBe('Blend berhasil dibuat!');
      expect(result.data).toEqual(mockBlend);
    });
  });

  // ── getAllBlends ─────────────────────────────────────────────────────────

  describe('getAllBlends', () => {
    it('should return all blends', async () => {
      mockPrisma.blend.findMany.mockResolvedValue([
        { id: 'b1', name: 'Blend 1' },
        { id: 'b2', name: 'Blend 2' },
      ]);

      const result = await service.getAllBlends();
      expect(result.data).toHaveLength(2);
    });
  });

  // ── getBlendById ─────────────────────────────────────────────────────────

  describe('getBlendById', () => {
    it('should throw 404 if blend not found', async () => {
      mockPrisma.blend.findUnique.mockResolvedValue(null);
      await expect(service.getBlendById('nonexistent')).rejects.toThrow(HttpException);
    });

    it('should return blend by id', async () => {
      const mockBlend = { id: 'b1', name: 'Test', sources: [] };
      mockPrisma.blend.findUnique.mockResolvedValue(mockBlend);

      const result = await service.getBlendById('b1');
      expect(result.data.id).toBe('b1');
    });
  });

  // ── deleteBlend ─────────────────────────────────────────────────────────

  describe('deleteBlend', () => {
    it('should delete blend successfully', async () => {
      mockPrisma.blend.delete.mockResolvedValue({});
      const result = await service.deleteBlend('b1');
      expect(result.message).toBe('Blend berhasil dihapus!');
    });

    it('should throw on delete error', async () => {
      mockPrisma.blend.delete.mockRejectedValue(new Error('DB error'));
      await expect(service.deleteBlend('bad-id')).rejects.toThrow(HttpException);
    });
  });

  // ── executeBlend ─────────────────────────────────────────────────────────

  describe('executeBlend', () => {
    it('should throw 404 if blend not found', async () => {
      mockPrisma.blend.findUnique.mockResolvedValue(null);
      await expect(service.executeBlend('nonexistent')).rejects.toThrow(HttpException);
    });

    it('should throw if less than 2 sources', async () => {
      mockPrisma.blend.findUnique.mockResolvedValue({
        id: 'b1',
        name: 'Blend',
        joinType: 'INNER',
        sources: [{ dataSourceId: 'ds1', joinKey: 'id', dataSource: { name: 'Source1' } }],
      });
      await expect(service.executeBlend('b1')).rejects.toThrow(HttpException);
    });

    it('should execute INNER JOIN correctly', async () => {
      mockPrisma.blend.findUnique.mockResolvedValue({
        id: 'b1',
        name: 'Revenue Blend',
        joinType: 'INNER',
        sources: [
          { dataSourceId: 'ds1', joinKey: 'campaign_id', dataSource: { name: 'GoogleAds' } },
          { dataSourceId: 'ds2', joinKey: 'campaign_id', dataSource: { name: 'FacebookAds' } },
        ],
      });

      // Mock $queryRaw for both sources
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          { recordData: { campaign_id: 'c1', clicks: 100 } },
          { recordData: { campaign_id: 'c2', clicks: 200 } },
        ])
        .mockResolvedValueOnce([
          { recordData: { campaign_id: 'c1', impressions: 5000 } },
          { recordData: { campaign_id: 'c3', impressions: 3000 } },
        ]);

      const result = await service.executeBlend('b1');

      // INNER JOIN: only c1 matches
      expect(result.rowCount).toBe(1);
      expect(result.data[0]['GoogleAds__campaign_id']).toBe('c1');
      expect(result.data[0]['FacebookAds__impressions']).toBe(5000);
    });
  });
});
