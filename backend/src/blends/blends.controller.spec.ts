import { Test, TestingModule } from '@nestjs/testing';
import { BlendsController } from './blends.controller';
import { BlendsService } from './blends.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('BlendsController', () => {
  let controller: BlendsController;
  let service: BlendsService;

  const mockBlendsService = {
    createBlend: jest.fn(),
    getAllBlends: jest.fn(),
    getBlendById: jest.fn(),
    executeBlend: jest.fn(),
    deleteBlend: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlendsController],
      providers: [
        { provide: BlendsService, useValue: mockBlendsService },
      ],
    }).compile();

    controller = module.get<BlendsController>(BlendsController);
    service = module.get<BlendsService>(BlendsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── POST /blends ──────────────────────────────────────────────────────

  describe('create', () => {
    it('should call service.createBlend with correct body', async () => {
      const body = {
        name: 'Revenue Blend',
        joinType: 'INNER' as const,
        sources: [
          { dataSourceId: 'ds1', streamName: 's1', joinKey: 'id' },
          { dataSourceId: 'ds2', streamName: 's2', joinKey: 'id' },
        ],
      };
      mockBlendsService.createBlend.mockResolvedValue({ message: 'Blend berhasil dibuat!', data: { id: 'b1' } });

      const result = await controller.create(body);

      expect(service.createBlend).toHaveBeenCalledWith(body);
      expect(result.message).toBe('Blend berhasil dibuat!');
    });
  });

  // ── GET /blends ───────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all blends', async () => {
      mockBlendsService.getAllBlends.mockResolvedValue({ data: [{ id: 'b1' }, { id: 'b2' }] });

      const result = await controller.findAll();

      expect(service.getAllBlends).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
    });
  });

  // ── GET /blends/:id ───────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return blend by id', async () => {
      mockBlendsService.getBlendById.mockResolvedValue({ data: { id: 'b1', name: 'Test Blend' } });

      const result = await controller.findOne('b1');

      expect(service.getBlendById).toHaveBeenCalledWith('b1');
      expect(result.data.id).toBe('b1');
    });

    it('should propagate 404 exception', async () => {
      mockBlendsService.getBlendById.mockRejectedValue(
        new HttpException('Blend tidak ditemukan', HttpStatus.NOT_FOUND),
      );

      await expect(controller.findOne('nonexistent')).rejects.toThrow(HttpException);
    });
  });

  // ── POST /blends/:id/execute ──────────────────────────────────────────

  describe('execute', () => {
    it('should execute blend and return result', async () => {
      const mockResult = { blendName: 'Test', rowCount: 10, data: [] };
      mockBlendsService.executeBlend.mockResolvedValue(mockResult);

      const result = await controller.execute('b1');

      expect(service.executeBlend).toHaveBeenCalledWith('b1');
      expect(result.rowCount).toBe(10);
    });
  });

  // ── DELETE /blends/:id ────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete blend and return success message', async () => {
      mockBlendsService.deleteBlend.mockResolvedValue({ message: 'Blend berhasil dihapus!' });

      const result = await controller.remove('b1');

      expect(service.deleteBlend).toHaveBeenCalledWith('b1');
      expect(result.message).toBe('Blend berhasil dihapus!');
    });
  });
});
