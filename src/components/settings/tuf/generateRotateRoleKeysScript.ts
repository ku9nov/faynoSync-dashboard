import { getKeyAlgorithmConfig } from './keyAlgorithm';

interface RotateRoleKeysScriptParams {
  appName: string;
  adminName: string;
  roleName: string;
  roleFileTag: string;
  keyCount: number;
  threshold: number;
  keyType: string;
}

export const generateRotateRoleKeysPythonScript = (params: RotateRoleKeysScriptParams): string => {
  const { appName, adminName, roleName, roleFileTag, keyCount, threshold, keyType } = params;
  const algorithm = getKeyAlgorithmConfig(keyType);

  return `#!/usr/bin/env python3
"""
Generate new ${roleName} keys for ${roleName} role rotation.

This script generates new ${roleName} private key file(s) in private_keys/
and creates new_${roleFileTag}_keys_info_${appName}_${adminName}.json for subsequent root metadata update.
"""

import argparse
import json
import sys
from pathlib import Path

try:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec, ed25519, rsa
    from securesystemslib.formats import encode_canonical
    import hashlib
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install cryptography securesystemslib")
    sys.exit(1)


KEY_ALGORITHM = "${algorithm.algorithm}"
KEY_TYPE = "${algorithm.tufKeyType}"
KEY_SCHEME = "${algorithm.tufScheme}"
ROLE_NAME = "${roleName}"
ROLE_FILE_TAG = "${roleFileTag}"


def calculate_key_id_from_public_value(public_value: str) -> str:
    """Calculate TUF key ID from canonical key representation."""
    key_dict = {
        "keytype": KEY_TYPE,
        "scheme": KEY_SCHEME,
        "keyval": {
            "public": public_value
        }
    }
    canonical = encode_canonical(key_dict)
    canonical_bytes = canonical if isinstance(canonical, bytes) else canonical.encode("utf-8")
    return hashlib.sha256(canonical_bytes).hexdigest()


def generate_key_pair():
    """Generate one key pair and its TUF key ID."""
    if KEY_ALGORITHM == "ed25519":
        private_key = ed25519.Ed25519PrivateKey.generate()
        public_key = private_key.public_key()
        public_value = public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        ).hex()
    elif KEY_ALGORITHM == "rsa":
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=3072)
        public_key = private_key.public_key()
        public_value = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode("utf-8")
    else:
        private_key = ec.generate_private_key(ec.SECP256R1())
        public_key = private_key.public_key()
        public_value = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode("utf-8")
    key_id = calculate_key_id_from_public_value(public_value)
    return private_key, public_value, key_id


def save_private_key(private_key, path: Path) -> None:
    """Save private key in PKCS8 PEM format."""
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    path.write_bytes(pem)


def main():
    parser = argparse.ArgumentParser(
        description=f"Generate new {ROLE_NAME} key(s) without root key rotation"
    )
    parser.add_argument(
        "--output-dir",
        default=str(Path(__file__).resolve().parent),
        help="Directory where private_keys/ and key info JSON will be written"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=${keyCount},
        help="Number of keys to generate"
    )
    parser.add_argument(
        "--threshold",
        type=int,
        default=${threshold},
        help="Threshold for role in new key info"
    )
    parser.add_argument(
        "--app-name",
        default="${appName}",
        help="App name used in output filename"
    )
    parser.add_argument(
        "--admin-name",
        default="${adminName}",
        help="Admin name used in output filename"
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    app_name = args.app_name
    admin_name = args.admin_name
    role_keys_count = int(args.count)
    role_threshold = int(args.threshold)

    if role_keys_count < 1:
        raise ValueError("--count must be >= 1")
    if role_threshold < 1:
        raise ValueError("--threshold must be >= 1")
    if role_threshold > role_keys_count:
        raise ValueError("--threshold cannot exceed --count")

    private_keys_dir = output_dir / "private_keys"
    private_keys_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print(f"Generating New {ROLE_NAME} Key(s) (without root key rotation)")
    print("=" * 70)
    print()

    new_keys = []
    for i in range(role_keys_count):
        private_key, public_value, key_id = generate_key_pair()
        new_keys.append({
            "private_key": private_key,
            "public": public_value,
            "public_hex": public_value,
            "key_id": key_id
        })
        print(f"  {ROLE_NAME} key {i+1}: {key_id[:16]}...")

    print()
    print(f"Saving new {ROLE_NAME} key(s)...")

    saved_keys = []
    for key_info in new_keys:
        key_file = private_keys_dir / key_info["key_id"]
        if key_file.exists():
            print(f"   Warning: Key file {key_info['key_id']} already exists, skipping...")
            continue

        save_private_key(key_info["private_key"], key_file)
        saved_keys.append(key_info)
        print(f"   Saved {key_info['key_id']}")

    if not saved_keys:
        print()
        print(f"No new {ROLE_NAME} key files were saved.")
        sys.exit(1)

    role_keys_info = {
        f"{ROLE_NAME}_keys": [
            {
                "key_id": key_info["key_id"],
                "public_hex": key_info["public_hex"],
                "file": f"private_keys/{key_info['key_id']}",
                "role": ROLE_NAME,
                "generated_for": "rotation"
            }
            for key_info in saved_keys
        ],
        f"{ROLE_NAME}_threshold": role_threshold
    }

    info_file = output_dir / f"new_{ROLE_FILE_TAG}_keys_info_{app_name}_{admin_name}.json"
    with open(info_file, "w") as f:
        json.dump(role_keys_info, f, indent=2)

    print()
    print(f"Saved key info: {info_file}")
    print()
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"Generated: {len(saved_keys)} new {ROLE_NAME} key(s)")
    print(f"Private keys dir: {private_keys_dir}/")
    for i, key_info in enumerate(saved_keys, 1):
        print(f"  {i}. Key ID: {key_info['key_id']}")
        print(f"     File:   private_keys/{key_info['key_id']}")
    print()


if __name__ == "__main__":
    main()
`;
};
