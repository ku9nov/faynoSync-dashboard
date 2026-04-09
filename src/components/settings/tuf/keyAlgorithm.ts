export type KeyAlgorithm = 'ed25519' | 'rsa' | 'ecdsa';

export interface KeyAlgorithmConfig {
  algorithm: KeyAlgorithm;
  tufKeyType: 'ed25519' | 'rsa' | 'ecdsa';
  tufScheme: 'ed25519' | 'rsassa-pss-sha256' | 'ecdsa-sha2-nistp256';
}

const ALGORITHM_CONFIGS: Record<KeyAlgorithm, Omit<KeyAlgorithmConfig, 'algorithm'>> = {
  ed25519: {
    tufKeyType: 'ed25519',
    tufScheme: 'ed25519',
  },
  rsa: {
    tufKeyType: 'rsa',
    tufScheme: 'rsassa-pss-sha256',
  },
  ecdsa: {
    tufKeyType: 'ecdsa',
    tufScheme: 'ecdsa-sha2-nistp256',
  },
};

export const DEFAULT_KEY_ALGORITHM: KeyAlgorithm = 'ed25519';

export const normalizeKeyAlgorithm = (value?: string): KeyAlgorithm => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'ed25519' || normalized === 'rsa' || normalized === 'ecdsa') {
    return normalized;
  }

  throw new Error(`Unsupported key type "${value ?? ''}". Allowed values: ed25519, rsa, ecdsa.`);
};

export const getKeyAlgorithmConfig = (value?: string): KeyAlgorithmConfig => {
  const algorithm = normalizeKeyAlgorithm(value ?? DEFAULT_KEY_ALGORITHM);
  return {
    algorithm,
    ...ALGORITHM_CONFIGS[algorithm],
  };
};
