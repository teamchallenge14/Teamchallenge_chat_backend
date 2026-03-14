export const roomReportTemplate = (payload: {
  reporterEmail: string;
  roomId: string;
  roomName: string;
  roomOwnerId: string;
  reason: string;
  details?: string;
}) => {
  const detailsHtml = payload.details
    ? `<p><strong>Details:</strong> ${escapeHtml(payload.details)}</p>`
    : '';

  return {
    subject: `Room report: ${payload.roomName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Room Report</h2>
        <p><strong>Reporter:</strong> ${escapeHtml(payload.reporterEmail)}</p>
        <p><strong>Room:</strong> ${escapeHtml(payload.roomName)} (${escapeHtml(
          payload.roomId,
        )})</p>
        <p><strong>Room Owner ID:</strong> ${escapeHtml(payload.roomOwnerId)}</p>
        <p><strong>Reason:</strong> ${escapeHtml(payload.reason)}</p>
        ${detailsHtml}
      </div>
    `,
  };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
