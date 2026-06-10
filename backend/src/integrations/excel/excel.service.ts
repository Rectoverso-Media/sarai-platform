import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export type ExcelExportMode = 'replace'; // Untuk download, selalu fresh file

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  /**
   * Generate file .xlsx dari data dan kembalikan sebagai Buffer.
   * @param sheetName Nama sheet dalam file Excel
   * @param columns Array nama kolom (header)
   * @param rows Array of arrays atau array of objects
   * @param title Judul opsional untuk baris pertama
   */
  async generateExcelBuffer(
    sheetName: string,
    columns: string[],
    rows: any[],
    title?: string,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'SARAI Platform';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet(sheetName || 'Export');

    let startRow = 1;

    // Tambahkan baris judul jika ada
    if (title) {
      const titleRow = sheet.addRow([title]);
      titleRow.font = { name: 'Calibri', bold: true, size: 14 };
      titleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A5F' }, // Warna navy SARAI
      };
      titleRow.getCell(1).font = {
        name: 'Calibri',
        bold: true,
        size: 14,
        color: { argb: 'FFFFFFFF' },
      };
      sheet.mergeCells(1, 1, 1, columns.length);
      sheet.addRow([]); // Baris kosong setelah judul
      startRow = 3;
    }

    // Header row dengan styling premium
    const headerRow = sheet.addRow(columns);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }, // Blue-600
      };
      cell.font = {
        name: 'Calibri',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11,
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF1D4ED8' } },
      };
    });
    headerRow.height = 24;

    // Data rows
    rows.forEach((row, idx) => {
      let rowData: any[];

      if (Array.isArray(row)) {
        rowData = row;
      } else if (typeof row === 'object' && row !== null) {
        rowData = columns.map((col) => row[col] ?? '');
      } else {
        rowData = [row];
      }

      const dataRow = sheet.addRow(rowData);

      // Zebra striping
      if (idx % 2 === 0) {
        dataRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F9FF' }, // Light blue
          };
        });
      }

      dataRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        };
      });

      dataRow.height = 20;
    });

    // Auto-width kolom berdasarkan konten
    columns.forEach((colName, idx) => {
      const column = sheet.getColumn(idx + 1);
      const maxLength = Math.max(
        colName.length,
        ...rows.map((row) => {
          const val = Array.isArray(row) ? row[idx] : (row[colName] ?? '');
          return String(val).length;
        }),
      );
      column.width = Math.min(Math.max(maxLength + 4, 12), 50);
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: startRow }];

    // Auto filter
    sheet.autoFilter = {
      from: { row: startRow, column: 1 },
      to: { row: startRow, column: columns.length },
    };

    this.logger.log(
      `✅ Excel file generated: ${rows.length} baris, ${columns.length} kolom`,
    );

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
