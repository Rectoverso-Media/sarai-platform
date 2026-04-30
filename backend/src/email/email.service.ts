import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Settingan penghubung ke server Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fungsi template untuk ngirim email apa aja
  async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      const mailOptions = {
        from: `"SARAI System" <${process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email terkirim: ' + info.response);
      return true;
    } catch (error) {
      console.error('Gagal ngirim email: ', error);
      throw new InternalServerErrorException('Gagal mengirim email');
    }
  }

  // Fungsi khusus buat ngetes doang
//   async sendTestEmail(targetEmail: string) {
//     const subject = 'Test Mesin Email SARAI 🚀';
//     const html = `
//       <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
//         <h2 style="color: #2563eb;">Setup Email Berhasil! 🎉</h2>
//         <p>Halo!</p>
//         <p>Kalau kamu baca pesan ini, berarti aplikasi NestJS kamu sukses membajak server Gmail untuk dijadikan kurir otomatis.</p>
//         <p>Gacor Kang! Lanjut ngoding.</p>
//       </div>
//     `;
//     return this.sendEmail(targetEmail, subject, html);
//   }

  // Fungsi ngirim email verifikasi ke user baru
  async sendVerificationEmail(email: string, token: string) {
    const verifyLink = `http://localhost:3001/auth/verify-email?token=${token}`;
    const subject = 'Verifikasi Email Akun SARAI 🔐';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; color: #333;">
        <h2 style="color: #2563eb;">Selamat datang di SARAI!</h2>
        <p>Terima kasih sudah mendaftar. Tinggal satu langkah lagi untuk mengaktifkan akun kamu.</p>
        <p>Silakan klik tombol di bawah ini untuk memverifikasi alamat email kamu:</p>
        <a href="${verifyLink}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Verifikasi Email Sekarang</a>
        <p style="font-size: 12px; color: #777;">Link ini akan kedaluwarsa dalam 1 jam.</p>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }
}