import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import { MailType } from './mail.types';
import { verifyEmailTemplate } from './templates/verify-email.template';
import { PrismaService } from 'prisma/prisma.service';
import { resetPasswordTemplate } from './templates/reset-password.template';
import { mailConfig } from 'src/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: false,
      auth: {
        user: mailConfig.user,
        pass: mailConfig.pass,
      },
    });
  }

  // =========================
  // PUBLIC API
  // =========================
  async send(type: MailType, payload: { email: string }) {
    switch (type) {
      case MailType.VERIFY_EMAIL:
        return this.sendVerifyEmail(payload.email);

      case MailType.RESET_PASSWORD:
        return this.sendResetPassword(payload.email);

      default: {
        const exhaustiveCheck: never = type;
        throw new BadRequestException(`Unknown mail type: ${String(exhaustiveCheck)}`);
      }
    }
  }

  // =========================
  // SEND VERIFY EMAIL
  // =========================
  private async sendVerifyEmail(email: string) {
    const authMethod = await this.prisma.authMethod.findFirst({
      where: { email },
      include: { user: true },
    });

    if (!authMethod) {
      throw new BadRequestException('User with this email not found');
    }

    // invalidate previous codes
    await this.prisma.emailVerification.updateMany({
      where: {
        userId: authMethod.userId,
        email,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);

    await this.prisma.emailVerification.create({
      data: {
        userId: authMethod.userId,
        email,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 хв
      },
    });

    const template = verifyEmailTemplate(code);

    await this.transporter.sendMail({
      from: mailConfig.from,
      to: email,
      subject: template.subject,
      html: template.html,
    });

    return { success: true };
  }

  // =========================
  // VERIFY EMAIL CODE
  // =========================
  async verifyEmailCode(payload: { email: string; code: string }) {
    const authMethod = await this.prisma.authMethod.findFirst({
      where: { email: payload.email },
    });

    if (!authMethod) {
      throw new BadRequestException('Invalid email');
    }

    const record = await this.prisma.emailVerification.findFirst({
      where: {
        userId: authMethod.userId,
        email: payload.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired code');
    }

    const match = await bcrypt.compare(payload.code, record.codeHash);
    if (!match) {
      throw new BadRequestException('Invalid code');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerification.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: authMethod.userId },
        data: {
          emailVerifiedAt: new Date(),
          identityVerifiedAt: new Date(),
        },
      }),
    ]);

    return { verified: true };
  }

  // =========================
  // RESET PASSWORD
  // =========================
  private async sendResetPassword(email: string) {
    const authMethod = await this.prisma.authMethod.findFirst({
      where: {
        email,
        provider: 'LOCAL',
      },
    });

    if (!authMethod) {
      throw new ForbiddenException('Password reset is available only for LOCAL accounts');
    }

    await this.prisma.passwordReset.updateMany({
      where: {
        userId: authMethod.userId,
        email,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);

    await this.prisma.passwordReset.create({
      data: {
        userId: authMethod.userId,
        email,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const template = resetPasswordTemplate(code);

    await this.transporter.sendMail({
      from: mailConfig.from,
      to: email,
      subject: template.subject,
      html: template.html,
    });

    return { success: true };
  }

  async confirmResetPassword(payload: { email: string; code: string; newPassword: string }) {
    const authMethod = await this.prisma.authMethod.findFirst({
      where: {
        email: payload.email,
        provider: 'LOCAL',
      },
    });

    if (!authMethod) {
      throw new ForbiddenException('Password reset is available only for LOCAL accounts');
    }

    const record = await this.prisma.passwordReset.findFirst({
      where: {
        userId: authMethod.userId,
        email: payload.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const isValid = await bcrypt.compare(payload.code, record.codeHash);
    if (!isValid) {
      throw new BadRequestException('Invalid reset code');
    }

    const newPasswordHash = await bcrypt.hash(payload.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.passwordReset.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.authMethod.update({
        where: { id: authMethod.id },
        data: { passwordHash: newPasswordHash },
      }),
    ]);

    return { passwordReset: true };
  }

  // =========================
  // HELPERS
  // =========================
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
