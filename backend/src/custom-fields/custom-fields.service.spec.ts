import { Test, TestingModule } from '@nestjs/testing';
import { CustomFieldsService } from './custom-fields.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException } from '@nestjs/common';

describe('CustomFieldsService', () => {
  let service: CustomFieldsService;

  const mockPrisma = {
    customField: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    customFieldMapping: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomFieldsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CustomFieldsService>(CustomFieldsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── createCustomField ─────────────────────────────────────────────────

  describe('createCustomField', () => {
    it('should throw on empty expression', async () => {
      await expect(
        service.createCustomField({ name: 'Test', dataType: 'NUMBER', expression: '' }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw on dangerous expression', async () => {
      await expect(
        service.createCustomField({ name: 'Test', dataType: 'NUMBER', expression: 'eval("bad")' }),
      ).rejects.toThrow(HttpException);
    });

    it('should create field with valid expression', async () => {
      const mockField = { id: 'cf1', name: 'ROI', dataType: 'NUMBER', expression: '(revenue - cost) / cost * 100' };
      mockPrisma.customField.create.mockResolvedValue(mockField);

      const result = await service.createCustomField({
        name: 'ROI',
        dataType: 'NUMBER',
        expression: '(revenue - cost) / cost * 100',
      });

      expect(result.message).toBe('Custom field berhasil dibuat!');
      expect(result.data.id).toBe('cf1');
    });

    it('should create mapping when targetTable is provided', async () => {
      const mockField = { id: 'cf2', name: 'CTR', dataType: 'NUMBER', expression: 'clicks / impressions * 100' };
      mockPrisma.customField.create.mockResolvedValue(mockField);
      mockPrisma.customFieldMapping.create.mockResolvedValue({});

      await service.createCustomField({
        name: 'CTR',
        dataType: 'NUMBER',
        expression: 'clicks / impressions * 100',
        targetTable: 'synced_data',
      });

      expect(mockPrisma.customFieldMapping.create).toHaveBeenCalledWith({
        data: { customFieldId: 'cf2', targetTable: 'synced_data' },
      });
    });
  });

  // ── getAllCustomFields ────────────────────────────────────────────────

  describe('getAllCustomFields', () => {
    it('should return all fields', async () => {
      mockPrisma.customField.findMany.mockResolvedValue([
        { id: 'cf1', name: 'ROI' },
        { id: 'cf2', name: 'CTR' },
      ]);

      const result = await service.getAllCustomFields();
      expect(result.data).toHaveLength(2);
    });
  });

  // ── getCustomFieldById ────────────────────────────────────────────────

  describe('getCustomFieldById', () => {
    it('should throw 404 if not found', async () => {
      mockPrisma.customField.findUnique.mockResolvedValue(null);
      await expect(service.getCustomFieldById('nonexistent')).rejects.toThrow(HttpException);
    });
  });

  // ── deleteCustomField ────────────────────────────────────────────────

  describe('deleteCustomField', () => {
    it('should delete successfully', async () => {
      mockPrisma.customField.delete.mockResolvedValue({});
      const result = await service.deleteCustomField('cf1');
      expect(result.message).toBe('Custom field berhasil dihapus!');
    });
  });

  // ── evaluateCustomField ──────────────────────────────────────────────

  describe('evaluateCustomField', () => {
    it('should evaluate expression against rows', async () => {
      mockPrisma.customField.findUnique.mockResolvedValue({
        id: 'cf1',
        name: 'profit',
        expression: 'revenue - cost',
      });

      const result = await service.evaluateCustomField('cf1', [
        { revenue: 1000, cost: 400 },
        { revenue: 2000, cost: 800 },
      ]);

      expect(result.results[0].profit).toBe(600);
      expect(result.results[1].profit).toBe(1200);
    });

    it('should handle string numbers', async () => {
      mockPrisma.customField.findUnique.mockResolvedValue({
        id: 'cf2',
        name: 'ctr',
        expression: 'clicks / impressions * 100',
      });

      const result = await service.evaluateCustomField('cf2', [
        { clicks: '50', impressions: '1000' },
      ]);

      expect(result.results[0].ctr).toBe(5);
    });

    it('should return error for invalid evaluation', async () => {
      mockPrisma.customField.findUnique.mockResolvedValue({
        id: 'cf3',
        name: 'test',
        expression: 'nonexistent_column + 5',
      });

      const result = await service.evaluateCustomField('cf3', [
        { revenue: 1000 },
      ]);

      // mathjs will throw if variable is not in scope
      expect(result.results[0].error).toBeTruthy();
    });
  });

  // ── previewExpression ────────────────────────────────────────────────

  describe('previewExpression', () => {
    it('should preview valid expression', async () => {
      const result = await service.previewExpression('a + b', { a: 10, b: 20 });
      expect(result.result).toBe(30);
      expect(result.valid).toBe(true);
    });

    it('should throw on invalid expression syntax', async () => {
      await expect(
        service.previewExpression('+++invalid', { a: 1 }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw on dangerous expression', async () => {
      await expect(
        service.previewExpression('require("fs")', { a: 1 }),
      ).rejects.toThrow(HttpException);
    });
  });

  // ── attachToTable ────────────────────────────────────────────────────

  describe('attachToTable', () => {
    it('should create mapping', async () => {
      const mockMapping = { id: 'm1', customFieldId: 'cf1', targetTable: 'synced_data' };
      mockPrisma.customFieldMapping.create.mockResolvedValue(mockMapping);

      const result = await service.attachToTable('cf1', 'synced_data');
      expect(result.message).toContain('berhasil dihubungkan');
    });
  });
});
