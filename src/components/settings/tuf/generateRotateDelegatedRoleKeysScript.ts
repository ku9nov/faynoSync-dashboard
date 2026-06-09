import { getKeyAlgorithmConfig } from '@/components/settings/tuf/keyAlgorithm';

interface RotateDelegatedRoleKeysScriptParams {
  appName: string;
  adminName: string;
  roleName: string;
  roleFileTag?: string;
  keyCount: number;
  threshold: number;
  keyType: string;
}

export const generateRotateDelegatedRoleKeysPythonScript = (
  params: RotateDelegatedRoleKeysScriptParams
): string => {
  const { appName, adminName, roleName, roleFileTag, keyCount, threshold, keyType } = params;
  const algorithm = getKeyAlgorithmConfig(keyType);

  return `#!/usr/bin/env python3
"""
Generate new delegated role key(s) for delegated role rotation.

This script does not modify metadata directly. It generates private key files
and exports role-specific key info JSON for the next rotation step.
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

try:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec, ed25519, rsa
    from securesystemslib.formats import encode_canonical
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install cryptography securesystemslib")
    sys.exit(1)


KEY_ALGORITHM = "${algorithm.algorithm}"
KEY_TYPE = "${algorithm.tufKeyType}"
KEY_SCHEME = "${algorithm.tufScheme}"


def calculate_key_id_from_public_value(public_value: str) -> str:
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


def save_private_key(private_key, filepath: Path) -> None:
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    filepath.write_bytes(pem)


def main():
    parser = argparse.ArgumentParser(
        description="Generate new delegated role key(s) for rotation"
    )
    parser.add_argument("--role-name", default="${roleName}", help="Delegated role name (e.g. default)")
    parser.add_argument(
        "--role-file-tag",
        default="${roleFileTag ?? ''}",
        help="Sanitized role tag used in output filename (optional)"
    )
    parser.add_argument(
        "--output-dir",
        default=str(Path(__file__).resolve().parent),
        help="Directory where private_keys/ and key info JSON will be written"
    )
    parser.add_argument("--count", type=int, default=${keyCount}, help="Number of keys to generate")
    parser.add_argument("--threshold", type=int, default=${threshold}, help="Role threshold for generated key info")
    parser.add_argument("--app-name", default="${appName}", help="App name used in output filename")
    parser.add_argument("--admin-name", default="${adminName}", help="Admin name used in output filename")
    args = parser.parse_args()

    role_name = args.role_name.strip()
    if not role_name:
        raise ValueError("--role-name cannot be empty")

    if args.count < 1:
        raise ValueError("--count must be >= 1")
    if args.threshold < 1:
        raise ValueError("--threshold must be >= 1")
    if args.threshold > args.count:
        raise ValueError("--threshold cannot exceed --count")

    output_dir = Path(args.output_dir)
    private_keys_dir = output_dir / "private_keys"
    private_keys_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print(f"Generating delegated role keys for role: {role_name}")
    print("=" * 70)

    generated = []
    for _ in range(args.count):
        private_key, public_value, key_id = generate_key_pair()
        generated.append({
            "private_key": private_key,
            "public_hex": public_value,
            "key_id": key_id
        })

    saved = []
    for item in generated:
        key_file = private_keys_dir / item["key_id"]
        if key_file.exists():
            print(f"Warning: key file already exists, skipping {item['key_id']}")
            continue
        save_private_key(item["private_key"], key_file)
        saved.append(item)
        print(f"Saved private key: private_keys/{item['key_id']}")

    if not saved:
        print("No keys were saved.")
        sys.exit(1)

    info = {
        "delegation_keys": [
            {
                "key_id": item["key_id"],
                "public_hex": item["public_hex"],
                "file": f"private_keys/{item['key_id']}",
                "role": "delegation",
                "delegation_role_name": role_name,
                "keytype": KEY_TYPE,
                "scheme": KEY_SCHEME,
                "generated_for": "rotation"
            }
            for item in saved
        ],
        "delegation_role": {
            "name": role_name,
            "threshold": args.threshold
        }
    }

    file_role_tag = args.role_file_tag.strip()
    if not file_role_tag:
        file_role_tag = role_name.lower().replace("/", "_").replace(" ", "_")

    out_name = f"new_{file_role_tag}_keys_info_{args.app_name}_{args.admin_name}.json"
    out_path = output_dir / out_name
    with open(out_path, "w") as f:
        json.dump(info, f, indent=2)

    print()
    print(f"Saved role key info: {out_path}")
    print(f"Generated keys: {len(saved)}")


if __name__ == "__main__":
    main()

`;
};
