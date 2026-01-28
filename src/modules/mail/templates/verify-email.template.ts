export function verifyEmailTemplate(code: string) {
  return {
    subject: 'Confirm your email',
    html: `
      <div style="font-family: Arial, sans-serif">
        <h2>Email confirmation</h2>
        <p>Your verification code:</p>
        <h1>${code}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn’t request this — ignore this email.</p>
      </div>
    `,
  };
}
