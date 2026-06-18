import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // Rute API buat ngetes: POST http://localhost:3001/email/test
//   @Post('test')
//   @ApiOperation({ summary: 'Kirim email tes ke alamat tertentu' })
//   @ApiResponse({ status: 200, description: 'Email tes berhasil dikirim' })
//   async testEmail(@Body('email') email: string) {
//     await this.emailService.sendTestEmail(email);
//     return { message: `Email tes berhasil meluncur ke ${email}!` };
//   }
}