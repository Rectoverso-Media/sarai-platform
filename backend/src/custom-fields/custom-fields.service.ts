import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { evaluate, MathNode, parse } from 'mathjs';

// Operator yang diizinkan (whitelist keamanan)
const SAFE_OPERATORS = ['+', '-', '*', '/', '%', '^', '(', ')'];

@Injectable()
export class CustomFieldsService {
  private readonly logger = new Logger(CustomFieldsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async createCustomField(data: {
    name: string;
    dataType: string;
    expression: string;
    targetTable?: string;
  }) {
    // Validasi ekspresi dulu sebelum simpan
    this.validateExpression(data.expression);

    try {
      const customField = await this.prisma.customField.create({
        data: {
          name: data.name,
          dataType: data.dataType,
          expression: data.expression,
        },
      });

      // Jika ada targetTable, langsung buat mapping
      if (data.targetTable) {
        await this.prisma.customFieldMapping.create({
          data: {
            customFieldId: customField.id,
            targetTable: data.targetTable,
          },
        });
      }

      return { message: 'Custom field berhasil dibuat!', data: customField };
    } catch (error) {
      this.logger.error('Error createCustomField:', error);
      throw new HttpException('Gagal membuat custom field', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllCustomFields() {
    const fields = await this.prisma.customField.findMany({
      orderBy: { createdAt: 'desc' },
      include: { mappings: true },
    });
    return { data: fields };
  }

  async getCustomFieldById(id: string) {
    const field = await this.prisma.customField.findUnique({
      where: { id },
      include: { mappings: true },
    });
    if (!field) throw new HttpException('Custom field tidak ditemukan', HttpStatus.NOT_FOUND);
    return { data: field };
  }

  async deleteCustomField(id: string) {
    try {
      await this.prisma.customField.delete({ where: { id } });
      return { message: 'Custom field berhasil dihapus!' };
    } catch (error) {
      throw new HttpException('Gagal menghapus custom field', HttpStatus.BAD_REQUEST);
    }
  }

  // ── EVALUATOR ─────────────────────────────────────────────────────────────

  /**
   * Evaluasi ekspresi custom field terhadap satu atau lebih baris data.
   * Ekspresi contoh: "revenue - cost", "clicks / impressions * 100", "(revenue - cost) / revenue * 100"
   *
   * @param fieldId - ID CustomField
   * @param rows - Array of objects, misal: [{ revenue: 1000, cost: 400 }, ...]
   */
  async evaluateCustomField(fieldId: string, rows: Record<string, any>[]) {
    const field = await this.prisma.customField.findUnique({ where: { id: fieldId } });
    if (!field) throw new HttpException('Custom field tidak ditemukan', HttpStatus.NOT_FOUND);

    const results = rows.map((row, index) => {
      try {
        // Buat scope dari record data (hanya nilai numerik yang diteruskan)
        const scope: Record<string, number> = {};
        for (const [key, value] of Object.entries(row)) {
          if (typeof value === 'number') {
            scope[key] = value;
          } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
            scope[key] = parseFloat(value);
          }
        }

        const result = evaluate(field.expression, scope);
        return {
          row: index,
          input: row,
          [field.name]: typeof result === 'number' ? Math.round(result * 10000) / 10000 : result,
          error: null,
        };
      } catch (evalError) {
        return {
          row: index,
          input: row,
          [field.name]: null,
          error: `Gagal evaluasi: ${evalError instanceof Error ? evalError.message : String(evalError)}`,
        };
      }
    });

    return {
      fieldName: field.name,
      expression: field.expression,
      results,
    };
  }

  /**
   * Evaluasi ekspresi preview (tanpa menyimpan ke DB).
   * Berguna untuk "test ekspresi" di frontend sebelum user save.
   */
  async previewExpression(expression: string, sampleData: Record<string, any>) {
    this.validateExpression(expression);

    const scope: Record<string, number> = {};
    for (const [key, value] of Object.entries(sampleData)) {
      if (typeof value === 'number') scope[key] = value;
      else if (!isNaN(parseFloat(String(value)))) scope[key] = parseFloat(String(value));
    }

    try {
      const result = evaluate(expression, scope);
      return {
        expression,
        sampleData,
        result: typeof result === 'number' ? Math.round(result * 10000) / 10000 : result,
        valid: true,
      };
    } catch (error) {
      throw new HttpException(
        `Ekspresi tidak valid: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ── MAPPING ───────────────────────────────────────────────────────────────

  async attachToTable(fieldId: string, targetTable: string) {
    const mapping = await this.prisma.customFieldMapping.create({
      data: { customFieldId: fieldId, targetTable },
    });
    return { message: 'Custom field berhasil dihubungkan ke tabel', data: mapping };
  }

  // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

  private validateExpression(expression: string): void {
    if (!expression || expression.trim().length === 0) {
      throw new HttpException('Ekspresi tidak boleh kosong', HttpStatus.BAD_REQUEST);
    }

    // Cek karakter berbahaya (SQL injection, JS injection)
    const dangerous = /[;`"'{}[\]\\]|import|require|eval|function|=>|class/.test(expression);
    if (dangerous) {
      throw new HttpException(
        'Ekspresi mengandung karakter tidak diizinkan',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Coba parse dengan mathjs untuk validasi syntax
    try {
      parse(expression);
    } catch (parseError) {
      throw new HttpException(
        `Sintaks ekspresi tidak valid: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
