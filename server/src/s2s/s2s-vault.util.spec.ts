import { encryptS2SSecret, decryptS2SSecret, getS2SEncryptionKey } from './s2s-vault.util';

describe('s2s-vault.util', () => {
  const mockKey = '0147852369abcdef0147852369abcdef0147852369abcdef0147852369abcdef';

  beforeEach(() => {
    process.env.S2S_ENCRYPTION_KEY = mockKey;
    delete process.env.NODE_ENV;
    delete process.env.APP_ENV;
  });

  it('should encrypt and decrypt S2S secrets accurately with enc:v1 envelope', () => {
    const rawSecret = 'gw_to_wl_s2s_secret_2026';
    const encrypted = encryptS2SSecret(rawSecret);

    expect(encrypted.startsWith('enc:v1:')).toBe(true);
    expect(encrypted.split(':')).toHaveLength(5);

    const decrypted = decryptS2SSecret(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it('should be idempotent when encrypting already encrypted secret', () => {
    const rawSecret = 'gw_to_wl_s2s_secret_2026';
    const encryptedOnce = encryptS2SSecret(rawSecret);
    const encryptedTwice = encryptS2SSecret(encryptedOnce);

    expect(encryptedTwice).toBe(encryptedOnce);
  });

  it('should return plaintext unchanged when decrypting legacy unencrypted secret', () => {
    const legacySecret = 'legacy_unencrypted_secret_string';
    const decrypted = decryptS2SSecret(legacySecret);
    expect(decrypted).toBe(legacySecret);
  });

  it('should return null when decrypting null or undefined', () => {
    expect(decryptS2SSecret(null)).toBeNull();
    expect(decryptS2SSecret(undefined)).toBeNull();
  });

  it('should throw critical fatal error in production if S2S_ENCRYPTION_KEY is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.S2S_ENCRYPTION_KEY;

    expect(() => getS2SEncryptionKey()).toThrow(
      'CRITICAL SECURITY FATAL: S2S_ENCRYPTION_KEY is strictly required in production environment',
    );
  });
});
