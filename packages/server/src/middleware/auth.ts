import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  username: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

export function generateToken(userId: string, username: string): string {
  return jwt.sign({ userId, username } as TokenPayload, getSecret(), {
    expiresIn: '1d',
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload;
  } catch {
    return null;
  }
}
