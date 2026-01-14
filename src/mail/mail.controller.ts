import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { MailType } from './mail.types';
import { routesV1 } from '@src/config/app.routes';

@ApiTags('Mail')
@Controller(routesV1.version)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  // =========================
  // SEND VERIFICATION CODE
  // =========================
  @Post(routesV1.mail.sendConfirm)
  @ApiOperation({
    summary: 'Send email verification code',
    description:
      'Sends a one-time verification code to the provided email address. ' +
      'User is resolved internally by email. Authentication is NOT required.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
          description: 'Email address to verify',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Verification code successfully sent to email',
  })
  @ApiResponse({
    status: 400,
    description: 'User with this email not found',
  })
  async sendVerifyEmail(@Body('email') email: string) {
    return this.mailService.send(MailType.VERIFY_EMAIL, { email });
  }

  // =========================
  // VERIFY EMAIL CODE
  // =========================
  @Post(routesV1.mail.confirm)
  @ApiOperation({
    summary: 'Confirm email verification',
    description:
      'Verifies email ownership using a previously sent verification code. ' +
      'Marks email and identity as verified.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'code'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
          description: 'Email address being verified',
        },
        code: {
          type: 'string',
          example: '123456',
          description: '6-digit verification code from email',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code',
  })
  async confirmVerifyEmail(@Body() body: { email: string; code: string }) {
    return this.mailService.verifyEmailCode(body);
  }

  // =================================
  //            password reset
  // =================================
  @Post(routesV1.mail.resetPasswordSend)
  @ApiOperation({
    summary: 'Send password reset code',
    description:
      'Sends a one-time password reset code to the provided email address. ' +
      'Available ONLY for users registered with LOCAL authentication method.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
          description: 'Email associated with a LOCAL account',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Password reset code successfully sent',
  })
  @ApiResponse({
    status: 400,
    description: 'User not found or password reset is not allowed for social login accounts',
  })
  async sendResetPassword(@Body('email') email: string) {
    return this.mailService.send(MailType.RESET_PASSWORD, { email });
  }

  // =============================
  //           password reset confirm
  // =============================
  @Post(routesV1.mail.resetPasswordConfirm)
  @ApiOperation({
    summary: 'Confirm password reset',
    description:
      'Resets the user password using a verification code sent to email. ' +
      'Works only for LOCAL authentication accounts.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'code', 'newPassword'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
          description: 'Email associated with a LOCAL account',
        },
        code: {
          type: 'string',
          example: '123456',
          description: '6-digit password reset code from email',
        },
        newPassword: {
          type: 'string',
          example: 'StrongPassword123!',
          description: 'New password (will be securely hashed)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset code',
  })
  async confirmResetPassword(
    @Body()
    body: {
      email: string;
      code: string;
      newPassword: string;
    },
  ) {
    return this.mailService.confirmResetPassword(body);
  }
}
