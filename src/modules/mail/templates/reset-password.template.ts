export const resetPasswordTemplate = (code: string) => ({
  subject: 'Reset your password',
  html: `
    <div style="font-family: Arial, sans-serif">
      <h2>Password reset</h2>

      <p>You requested a password reset.</p>

      <p>
        <strong>Your verification code:</strong>
      </p>

      <h1 style="letter-spacing: 4px">${code}</h1>

      <p>This code will expire in 10 minutes.</p>

      <p>If you didn’t request this — ignore this email.</p>
    </div>
  `,
});
