// Generate a short, readable session ID
export function generateSessionId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if session is the default (potentially shared)
export function isDefaultSession(sessionId: string): boolean {
  return sessionId === 'default' || !sessionId;
}
