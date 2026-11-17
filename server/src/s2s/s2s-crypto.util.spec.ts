import {
  generateS2SSignature,
  verifyS2SSignature,
  normalizeS2SPath,
  canonicalizeS2SBody,
} from './s2s-crypto.util';

describe('S2SCryptoUtil', () => {
  const secret = 'prism_test_secret_key_12345';
  const timestamp = '1773000000';
  const method = 'POST';
  const path = '/api/v1/auth/sync';
  const body = { userId: 'usr_1', role: 'ADMIN' };

  it('should generate consistent HMAC-SHA256 signature', () => {
    const sig1 = generateS2SSignature(secret, timestamp, method, path, body);
    const sig2 = generateS2SSignature(secret, timestamp, method, path, body);
    expect(sig1).toBeDefined();
    expect(sig1).toHaveLength(64); // SHA256 hex is 64 chars
    expect(sig1).toEqual(sig2);
  });

  it('should verify valid signature accurately', () => {
    const sig = generateS2SSignature(secret, timestamp, method, path, body);
    const isValid = verifyS2SSignature(secret, timestamp, method, path, sig, body);
    expect(isValid).toBe(true);
  });

  it('should reject tampered signature', () => {
    const sig = generateS2SSignature(secret, timestamp, method, path, body);
    const tampered = sig.slice(0, -2) + (sig.endsWith('0') ? '1' : '0');
    const isValid = verifyS2SSignature(secret, timestamp, method, path, tampered, body);
    expect(isValid).toBe(false);
  });

  it('should reject tampered body payload', () => {
    const sig = generateS2SSignature(secret, timestamp, method, path, body);
    const tamperedBody = { userId: 'usr_1', role: 'USER' };
    const isValid = verifyS2SSignature(secret, timestamp, method, path, sig, tamperedBody);
    expect(isValid).toBe(false);
  });

  it('should reject tampered timestamp', () => {
    const sig = generateS2SSignature(secret, timestamp, method, path, body);
    const isValid = verifyS2SSignature(secret, '1773000001', method, path, sig, body);
    expect(isValid).toBe(false);
  });

  it('should reject invalid or empty signature format gracefully', () => {
    expect(verifyS2SSignature(secret, timestamp, method, path, '', body)).toBe(false);
    expect(verifyS2SSignature(secret, timestamp, method, path, 'invalid_short', body)).toBe(false);
  });

  it('should normalize path properly', () => {
    expect(normalizeS2SPath('api/v1/test')).toBe('/api/v1/test');
    expect(normalizeS2SPath('/api/v1/test?query=123')).toBe('/api/v1/test');
    expect(canonicalizeS2SBody(undefined)).toBe('');
    expect(canonicalizeS2SBody(null)).toBe('');
    expect(canonicalizeS2SBody('raw_string')).toBe('raw_string');
  });
});
