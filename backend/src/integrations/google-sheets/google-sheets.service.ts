import { Injectable, Logger } from '@nestjs/common';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export type ExportMode = 'append' | 'replace';

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);

  async exportData(
    sheetId: string,
    tabName: string,
    columns: string[],
    rows: any[],
    mode: ExportMode = 'replace',
  ) {
    try {
      this.logger.log(
        `Memulai ekspor ke Google Sheets: ${sheetId} (mode: ${mode})`,
      );

      if (!columns || columns.length === 0) {
        throw new Error(
          'Tidak dapat mengekspor data kosong. Tabel tidak memiliki kolom/header.',
        );
      }

      // ✅ SECURITY FIX: Baca credentials dari environment variables, BUKAN dari file JSON
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!clientEmail || !privateKey) {
        throw new Error(
          'Google credentials tidak dikonfigurasi. Set GOOGLE_CLIENT_EMAIL dan GOOGLE_PRIVATE_KEY di environment variables.',
        );
      }

      // 1. Auth via Service Account dari env vars
      const serviceAccountAuth = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
        ],
      });

      // 2. Hubungkan ke dokumen
      const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
      await doc.loadInfo();
      this.logger.log(`Berhasil terhubung ke dokumen: "${doc.title}"`);

      // 3. Cari atau buat tab
      let sheet = doc.sheetsByTitle[tabName];

      if (!sheet) {
        this.logger.log(`Tab '${tabName}' tidak ditemukan. Membuat tab baru...`);
        sheet = await doc.addSheet({ title: tabName, headerValues: columns });
      } else {
        if (mode === 'replace') {
          // Mode REPLACE: bersihkan semua data, set ulang header
          this.logger.log(`Mode REPLACE: membersihkan data lama di tab '${tabName}'`);
          await sheet.clear();
          await sheet.setHeaderRow(columns);
        } else {
          // Mode APPEND: pastikan header konsisten, tidak hapus data yang ada
          this.logger.log(`Mode APPEND: menambahkan baris ke tab '${tabName}'`);
          await sheet.loadHeaderRow();
          // Jika header belum ada atau sheet kosong, set header dulu
          if (!sheet.headerValues || sheet.headerValues.length === 0) {
            await sheet.setHeaderRow(columns);
          }
        }
      }

      // 4. Format rows: array → object keyed by column name
      const formattedRows = rows.map((rowArray) => {
        const rowObject: Record<string, any> = {};
        columns.forEach((colName, index) => {
          rowObject[colName] = Array.isArray(rowArray) ? rowArray[index] : rowArray[colName];
        });
        return rowObject;
      });

      // 5. Push data
      await sheet.addRows(formattedRows);

      this.logger.log(
        `✅ Sukses ${mode === 'append' ? 'menambahkan' : 'mengekspor'} ${rows.length} baris ke Google Sheets!`,
      );
      return {
        success: true,
        message: `Berhasil ${mode === 'append' ? 'menambahkan' : 'mengekspor'} ${rows.length} baris ke tab "${tabName}".`,
        rowsProcessed: rows.length,
        mode,
      };
    } catch (error) {
      this.logger.error('❌ Gagal mengekspor ke Google Sheets:', error);
      throw new Error(
        `Gagal ekspor ke Sheets: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}