import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { google } from 'googleapis';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DataTransfersService {
  private prisma = new PrismaClient();

  // 1. FUNGSI UNTUK MEMBACA KUNCI RAHASIA (AUTHENTICATION)
  private getAuthClient() {
    try {
      // Pastikan file google-credentials.json ada di root backend/
      const keyFilePath = path.join(process.cwd(), 'google-credentials.json');
      
      const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      return auth;
    } catch (error) {
      console.error("Kunci Google tidak ditemukan!", error);
      throw new HttpException('Kunci Google belum di-setup', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 2. FUNGSI UNTUK MENEMBAK DATA KE SPREADSHEET
  async pushDataToSheet(spreadsheetId: string, sheetName: string, dataArray: any[][]) {
    try {
      const auth = this.getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A1`, 
        valueInputOption: 'USER_ENTERED', 
        requestBody: {
          values: dataArray, 
        },
      });

      return {
        message: 'Data berhasil ditembak ke Google Sheets! 🚀',
        updatedCells: response.data.updates?.updatedCells,
      };
    } catch (error: any) {
      console.error('Google Sheets Error:', error.message);
      throw new HttpException(`Gagal menulis ke Google Sheets: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  // 3. FUNGSI UNTUK MENJALANKAN TRANSFER DATA ASLI
  async executeTransfer(transferId: string) {
    try {
      const config = await this.prisma.transfer.findUnique({
        where: { id: transferId },
        include: { source: true } 
      });

      if (!config) throw new Error('Konfigurasi transfer tidak ditemukan');

      // Ambil data asli dari database
      const allSources = await this.prisma.dataSource.findMany();

      // Convert ke format Matrix Google Sheets
      const header = ['ID', 'Nama Koneksi', 'Tipe', 'Status', 'Trial Sampai'];
      const rows = allSources.map(s => [
        s.id.substring(0, 8),
        s.name,
        s.connectorName || s.sourceType,
        s.status,
        s.trialEndsAt?.toISOString() || null // ✅ FIX: Tambah tanda tanya (?) di trialEndsAt
      ]);

      const finalData = [header, ...rows];

      // Tembak data ke Google Sheets
      return await this.pushDataToSheet(
        (config.configData as any)?.spreadsheetId, // ✅ FIX: Ambil parameter dari dalam configData JSON
        (config.configData as any)?.sheetName,     // ✅ FIX: Ambil parameter dari dalam configData JSON
        finalData
      );
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 4. FUNGSI SIMPAN KONFIGURASI BARU
  async createTransfer(data: any) {
    return this.prisma.transfer.create({
      data: {
        name: data.name,
        sourceId: data.sourceId, // ✅ FIX: sourceId wajib dimasukkan sesuai relasi database
        targetType: "Google Sheets",
        
        // ✅ FIX: Bungkus semua atribut spesifik Google Sheets ke dalam configData JSON
        configData: {
          spreadsheetId: data.spreadsheetId,
          sheetName: data.sheetName,
          writeMode: data.writeMode || 'append'
        }
      }
    });
  }
}