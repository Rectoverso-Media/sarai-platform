import { Injectable, Logger } from '@nestjs/common';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import * as credentials from '../../google-credentials.json'; 

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);

  async exportData(sheetId: string, tabName: string, columns: string[], rows: any[]) {
    try {

        
      this.logger.log(`Memulai proses ekspor ke Google Sheets: ${sheetId}`);

      if (!columns || columns.length === 0) {
        throw new Error('Tidak dapat mengekspor data kosong. Tabel tidak memiliki kolom/header.');
      }
      // 1. Inisialisasi KTP Robot (Authentication)
      const serviceAccountAuth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
        ],
      });

      // 2. Hubungkan ke Dokumen Sheets
      const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
      await doc.loadInfo(); 
      this.logger.log(`Berhasil terhubung ke dokumen: ${doc.title}`);

      // 3. Cari Tab (Sheet) yang dituju, atau bikin baru kalau belum ada
      let sheet = doc.sheetsByTitle[tabName];
      if (!sheet) {
        this.logger.log(`Tab '${tabName}' tidak ditemukan. Membuat tab baru...`);
        sheet = await doc.addSheet({ title: tabName, headerValues: columns });
      } else {
        // Kalau tab sudah ada, kita timpa headernya dan bersihkan data lama (opsional)
        await sheet.clear();
        await sheet.setHeaderRow(columns);
      }

      // 4. Susun format data baris agar sesuai dengan nama kolom (header)
      // Google-spreadsheet butuh format objek: { "nama_kolom": "nilai_sel" }
      const formattedRows = rows.map((rowArray) => {
        const rowObject: Record<string, any> = {};
        columns.forEach((colName, index) => {
          rowObject[colName] = rowArray[index];
        });
        return rowObject;
      });

      // 5. Tembakkan Data ke Sheets! 
      await sheet.addRows(formattedRows);
      
      this.logger.log(`✅ Sukses mengirim ${rows.length} baris data ke Google Sheets!`);
      return { success: true, message: `Berhasil mengekspor ${rows.length} baris.` };

    } catch (error) {
      this.logger.error('❌ Gagal mengekspor ke Google Sheets:', error);
      throw new Error(`Gagal ekspor ke Sheets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}