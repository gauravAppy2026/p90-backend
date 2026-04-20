import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const normalizedEmail = registerDto.email.toLowerCase();
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
    );
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      await bcrypt.hash(tokens.refreshToken, 10),
    );

    return {
      message: 'Registration successful',
      data: {
        user: { id: user._id, email: user.email, name: user.name, role: user.role },
        ...tokens,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
    );
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      await bcrypt.hash(tokens.refreshToken, 10),
    );

    return {
      message: 'Login successful',
      data: {
        user: { id: user._id, email: user.email, name: user.name, role: user.role },
        ...tokens,
      },
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersService.findByIdWithRefreshToken(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
    );
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      await bcrypt.hash(tokens.refreshToken, 10),
    );

    return {
      message: 'Token refreshed',
      data: tokens,
    };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      goals: user.goals,
      consentStatus: user.consentStatus,
      consentDate: user.consentDate,
    };
  }

  async updateProfile(userId: string, updateData: any) {
    const allowedFields = ['name', 'goals', 'baselineMetrics'];
    const filtered: any = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) filtered[key] = updateData[key];
    }
    return this.usersService.update(userId, filtered);
  }

  async recordConsent(userId: string) {
    return this.usersService.update(userId, {
      consentStatus: true,
      consentDate: new Date(),
    });
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);
    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      return { message: 'If an account with that email exists, a reset code has been sent.' };
    }

    const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-char code
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const hashedToken = await bcrypt.hash(resetToken, 10);
    await this.usersService.setResetToken(
      user._id.toString(),
      hashedToken,
      expires,
    );

    // Send reset code via Brevo HTTP API (SMTP blocked on Render free tier)
    try {
      const brevoApiKey = this.configService.get('BREVO_API_KEY');
      const senderEmail = this.configService.get('BREVO_SMTP_USER') || 'noreply@p90app.com';
      if (brevoApiKey) {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: 'P90 Companion', email: senderEmail },
            to: [{ email: normalizedEmail }],
            subject: 'Your P90 Password Reset Code',
            htmlContent: `
              <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="width: 56px; height: 56px; background: #10b981; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
                    <span style="font-size: 28px; color: white;">🍃</span>
                  </div>
                  <h2 style="color: #292524; margin: 16px 0 4px;">Password Reset</h2>
                  <p style="color: #78716c; font-size: 14px;">P90 Companion</p>
                </div>
                <p style="color: #44403c; font-size: 15px; line-height: 1.6;">
                  You requested a password reset. Use the code below to reset your password. This code expires in <strong>15 minutes</strong>.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <div style="display: inline-block; background: #f5f5f4; border-radius: 12px; padding: 16px 32px; letter-spacing: 8px; font-size: 32px; font-weight: bold; color: #292524;">
                    ${resetToken}
                  </div>
                </div>
                <p style="color: #78716c; font-size: 13px; line-height: 1.5;">
                  If you didn't request this, you can safely ignore this email. Your password won't be changed.
                </p>
              </div>
            `,
          }),
        });
        if (!response.ok) {
          const errBody = await response.text();
          console.error('Brevo API error:', response.status, errBody);
        }
      } else {
        console.log(`[Password Reset] Code for ${normalizedEmail}: ${resetToken}`);
      }
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr);
    }

    return {
      message: 'If an account with that email exists, a reset code has been sent.',
    };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (
      !user ||
      !user.resetPasswordToken ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const tokenMatch = await bcrypt.compare(token, user.resetPasswordToken);
    if (!tokenMatch) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user._id.toString(), hashedPassword);

    return { message: 'Password reset successful. You can now log in.' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiration'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiration'),
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
