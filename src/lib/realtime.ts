// Realtime notification helper.
//
// Previously this emitted events to a socket.io mini-service on port 3003.
// That approach does not work on Vercel serverless (no persistent WebSocket server).
//
// Now this is a no-op stub. The admin panel uses client-side polling instead:
// it fetches /api/admin/bookings every 15 seconds and detects new bookings.
// The ntfy and Telegram notification calls in the booking route still work
// fine over plain HTTP and provide real-time push to the admin's phone.

export async function emitRealtime(_event: string, _data: any): Promise<void> {
  // No-op. Admin panel polls /api/admin/bookings every 15 seconds.
  // ntfy + Telegram notifications are sent directly in the booking route.
}
