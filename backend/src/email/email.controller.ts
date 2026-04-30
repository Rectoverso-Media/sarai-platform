import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // Rute API buat ngetes: POST http://localhost:3001/email/test
//   @Post('test')
//   async testEmail(@Body('email') email: string) {
//     await this.emailService.sendTestEmail(email);
//     return { message: `Email tes berhasil meluncur ke ${email}!` };
//   }
}