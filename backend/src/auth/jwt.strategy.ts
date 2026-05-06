import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      // Ngambil token dari header: "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Tolak token yang udah expired
      secretOrKey: 'SARAI_RAHASIA_SUPER_AMAN_123!', 
    });
  }

  // Fungsi ini otomatis jalan kalau tokennya valid
  async validate(payload: any) {
    // Data yang di-return di sini akan otomatis nempel di `req.user` pada Controller
    return { 
      userId: payload.sub || payload.id, 
      email: payload.email, 
      teamId: payload.teamId, 
      role: payload.role 
    };
  }
}