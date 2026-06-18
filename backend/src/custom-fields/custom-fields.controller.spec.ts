import { Test, TestingModule } from '@nestjs/testing';
import { CustomFieldsController } from './custom-fields.controller';
import { CustomFieldsService } from './custom-fields.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('CustomFieldsController', () => {
  let controller: CustomFieldsController;
  let service: CustomFieldsService;

  const mockCustomFieldsService = {
    createCustomField: jest.fn(),
    getAllCustomFields: jest.fn(),
    getCustomFieldById: jest.fn(),
    deleteCustomField: jest.fn(),
    evaluateCustomField: jest.fn(),
    previewExpression: jest.fn(),
    attachToTable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomFieldsController],
      providers: [
        { provide: CustomFieldsService, useValue: mockCustomFieldsService },
      ],
    }).compile();

    controller = module.get<CustomFieldsController>(CustomFieldsController);
    service = module.get<CustomFieldsService>(CustomFieldsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── POST /custom-fields ───────────────────────────────────────────────

  describe('create', () => {
    it('should create custom field', async () => {
      const body = { name: 'ROI', dataType: 'NUMBER', expression: '(revenue - cost) / cost * 100' };
      mockCustomFieldsService.createCustomField.mockResolvedValue({
        message: 'Custom field berhasil dibuat!',
        data: { id: 'cf1', ...body },
      });

      const result = await controller.create(body);

      expect(service.createCustomField).toHaveBeenCalledWith(body);
      expect(result.message).toBe('Custom field berhasil dibuat!');
    });
  });

  // ── GET /custom-fields ────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all custom fields', async () => {
      mockCustomFieldsService.getAllCustomFields.mockResolvedValue({
        data: [{ id: 'cf1' }, { id: 'cf2' }],
      });

      const result = await controller.findAll();

      expect(service.getAllCustomFields).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
    });
  });

  // ── GET /custom-fields/:id ────────────────────────────────────────────

  describe('findOne', () => {
    it('should return custom field by id', async () => {
      mockCustomFieldsService.getCustomFieldById.mockResolvedValue({
        data: { id: 'cf1', name: 'ROI' },
      });

      const result = await controller.findOne('cf1');

      expect(service.getCustomFieldById).toHaveBeenCalledWith('cf1');
      expect(result.data.name).toBe('ROI');
    });

    it('should propagate 404 exception', async () => {
      mockCustomFieldsService.getCustomFieldById.mockRejectedValue(
        new HttpException('Custom field tidak ditemukan', HttpStatus.NOT_FOUND),
      );

      await expect(controller.findOne('nonexistent')).rejects.toThrow(HttpException);
    });
  });

  // ── DELETE /custom-fields/:id ─────────────────────────────────────────

  describe('remove', () => {
    it('should delete custom field', async () => {
      mockCustomFieldsService.deleteCustomField.mockResolvedValue({
        message: 'Custom field berhasil dihapus!',
      });

      const result = await controller.remove('cf1');

      expect(service.deleteCustomField).toHaveBeenCalledWith('cf1');
      expect(result.message).toBe('Custom field berhasil dihapus!');
    });
  });

  // ── POST /custom-fields/:id/evaluate ─────────────────────────────────

  describe('evaluate', () => {
    it('should evaluate expression', async () => {
      const body = { rows: [{ revenue: 1000, cost: 400 }] };
      const mockResult = { fieldName: 'ROI', expression: '...', results: [{ row: 0, ROI: 150 }] };
      mockCustomFieldsService.evaluateCustomField.mockResolvedValue(mockResult);

      const result = await controller.evaluate('cf1', body);

      expect(service.evaluateCustomField).toHaveBeenCalledWith('cf1', body.rows);
      expect(result.fieldName).toBe('ROI');
    });
  });

  // ── POST /custom-fields/preview ───────────────────────────────────────

  describe('preview', () => {
    it('should preview expression result', async () => {
      const body = { expression: 'a + b', sampleData: { a: 5, b: 3 } };
      mockCustomFieldsService.previewExpression.mockResolvedValue({
        result: 8,
        valid: true,
        expression: 'a + b',
      });

      const result = await controller.preview(body);

      expect(service.previewExpression).toHaveBeenCalledWith('a + b', { a: 5, b: 3 });
      expect(result.result).toBe(8);
    });

    it('should propagate validation error', async () => {
      mockCustomFieldsService.previewExpression.mockRejectedValue(
        new HttpException('Ekspresi tidak valid', HttpStatus.BAD_REQUEST),
      );

      await expect(
        controller.preview({ expression: 'bad!!!', sampleData: {} }),
      ).rejects.toThrow(HttpException);
    });
  });

  // ── POST /custom-fields/:id/attach ────────────────────────────────────

  describe('attach', () => {
    it('should attach field to table', async () => {
      mockCustomFieldsService.attachToTable.mockResolvedValue({
        message: 'Custom field berhasil dihubungkan ke tabel',
        data: { id: 'm1' },
      });

      const result = await controller.attach('cf1', { targetTable: 'synced_data' });

      expect(service.attachToTable).toHaveBeenCalledWith('cf1', 'synced_data');
      expect(result.message).toContain('berhasil dihubungkan');
    });
  });
});
