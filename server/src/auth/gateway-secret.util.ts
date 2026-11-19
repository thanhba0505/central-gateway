import * as crypto from 'crypto';

/**
 * Validates an HTTP Authorization Bearer header against GATEWAY_SECRET_KEY in constant time.
 */
export function verifyGatewayBearerSecret(
  authHeader: string | undefined,
  configuredSecret: string | undefined = process.env.GATEWAY_SECRET_KEY,
): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ') || !configuredSecret) {
    return false;
  }

  const token = authHeader.slice(7).trim();
  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(configuredSecret);

  if (tokenBuffer.length === 0 || tokenBuffer.length !== secretBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
}
