interface EmailParams { to: string; subject: string; body: string; }
export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.GMAIL_CREDENTIALS) { console.log(`[Email] To: ${params.to} | ${params.subject}`); return false; }
  return true;
}
export function generateBookingConfirmationEmail(booking: any): EmailParams {
  return { to: booking.customer?.email || "", subject: `Booking ${booking.bookingId}`, body: `Booking confirmed. Amount: ₹${booking.finalEstimate}` };
}
