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
        <p>Silakan klik tombol di bawah ini untuk memverifikasi alamat email:</p>
        <a href="${verifyLink}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Verifikasi Email Sekarang</a>
        <p style="font-size: 12px; color: #777;">Link ini akan kedaluwarsa dalam 1 jam.</p>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }

  // Fungsi ngirim email reset password
  async sendResetPasswordEmail(email: string, token: string) {
    // Nanti link ini mengarah ke halaman set-new-password di frontend
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    const subject = 'Reset Password Akun SARAI 🔑';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; color: #333;">
        <h2 style="color: #5f748d;">Permintaan Reset Password</h2>
        <p>Kami menerima permintaan untuk mereset password akun SARAI kamu.</p>
        <p>Silakan klik tombol di bawah ini untuk membuat password baru:</p>
        <a href="${resetLink}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #5f748d; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
        <p style="font-size: 12px; color: #777;">Link ini hanya berlaku selama 15 menit. Jika kamu tidak merasa meminta reset password, abaikan saja email ini.</p>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }

  // Fungsi ngirim email undangan tim
  async sendTeamInviteEmail(email: string, inviterName: string, teamName: string, token: string) {
    // Link ini nanti mengarah ke halaman Register dengan membawa token undangan
    const inviteLink = `http://localhost:3000/register?inviteToken=${token}`;
    const subject = `Undangan Bergabung ke Tim ${teamName} di SARAI 🏢`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; color: #333;">
        <h2 style="color: #2563eb;">Kamu Diundang!</h2>
        <p>Halo! <b>${inviterName}</b> telah mengundang kamu untuk bergabung ke dalam tim <b>${teamName}</b> di platform SARAI.</p>
        <p>Silakan klik tombol di bawah ini untuk menerima undangan dan membuat akun:</p>
        <a href="${inviteLink}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Terima Undangan</a>
        <p style="font-size: 12px; color: #777;">Link undangan ini berlaku selama 7 hari.</p>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }

  // Fungsi kirim email terkait billing (payment_failed, subscription_canceled, trial_expiring)
  async sendBillingEmail(
    to: string,
    event: 'payment_failed' | 'subscription_canceled' | 'trial_expiring',
    details: { teamName?: string; daysLeft?: number },
  ) {
    let subject: string;
    let html: string;
    const billingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?tab=billing`;

    switch (event) {
      case 'payment_failed':
        subject = '⚠️ Pembayaran SARAI Gagal — Tindakan Diperlukan';
        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; color: #333;">
            <h2 style="color: #dc2626;">Pembayaran Gagal</h2>
            <p>Halo! Sayangnya pembayaran langganan untuk tim <b>${details.teamName || 'kamu'}</b> di SARAI gagal diproses.</p>
            <p>Akun kamu akan beralih ke Free Plan jika pembayaran tidak diperbarui dalam 3 hari.</p>
            <a href="${billingUrl}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Perbarui Metode Pembayaran</a>
            <p style="font-size: 12px; color: #777;">Jika kamu memerlukan bantuan, hubungi support@sarai.io</p>
          </div>
        `;
        break;

      case 'subscription_canceled':
        subject = '😢 Langganan SARAI Kamu Telah Dibatalkan';
        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; color: #333;">
            <h2 style="color: #64748b;">Langganan Dibatalkan</h2>
            <p>Langganan SARAI untuk tim <b>${details.teamName || 'kamu'}</b> telah dibatalkan.</p>
            <p>Kamu masih bisa menggunakan akun dengan batasan Free Plan.</p>
            <a href="${billingUrl}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Aktifkan Kembali</a>
          </div>
        `;
        break;

      case 'trial_expiring':
        subject = `⏰ Trial SARAI Kamu Akan Berakhir dalam ${details.daysLeft} Hari`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; color: #333;">
            <h2 style="color: #d97706;">Trial Hampir Berakhir</h2>
            <p>Trial SARAI untuk tim <b>${details.teamName || 'kamu'}</b> akan berakhir dalam <b>${details.daysLeft} hari</b>.</p>
            <p>Upgrade sekarang untuk tetap menikmati semua fitur tanpa gangguan.</p>
            <a href="${billingUrl}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #d97706; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Upgrade Sekarang</a>
          </div>
        `;
        break;

      default:
        return;
    }

    return this.sendEmail(to, subject, html);
  }
}