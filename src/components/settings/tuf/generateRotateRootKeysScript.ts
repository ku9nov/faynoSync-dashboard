interface RotateRootKeysScriptParams {
  appName: string;
  keyCount: number;
  adminName: string;
  keyDirName?: string; // Optional: defaults to "private_keys" for online flow, or "root_keys_{appName}_{adminName}" for offline
}

export const generateRotateRootKeysPythonScript = (params: RotateRootKeysScriptParams): string => {
  const { appName, keyCount, adminName, keyDirName } = params;
  
  // Determine key directory name
  const defaultKeyDir = keyDirName || "private_keys";
  const isOfflineFlow = keyDirName !== undefined && keyDirName !== "private_keys";
  const flowTypeSuffix = isOfflineFlow ? " (Offline Flow)" : "";

  return `#!/usr/bin/env python3
"""
Generate new root keys for root metadata rotation${flowTypeSuffix}.

This script generates new root keys and saves them to the ${defaultKeyDir} directory.
It does not delete or modify existing keys - it only adds new ones.
"""

import json
import sys
from pathlib import Path

try:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ed25519
    from cryptography.hazmat.backends import default_backend
    import hashlib
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install cryptography")
    sys.exit(1)


def calculate_key_id_from_public_hex(public_hex: str) -> str:
    """
    Calculate TUF key ID from hex-encoded public key.
    
    TUF key ID is SHA256 of the canonical JSON representation of the key.
    """
    key_dict = {
        "keytype": "ed25519",
        "scheme": "ed25519",
        "keyval": {
            "public": public_hex
        }
    }
    
    canonical_json = json.dumps(key_dict, sort_keys=True, separators=(',', ':'))
    canonical_bytes = canonical_json.encode('utf-8')
    key_id = hashlib.sha256(canonical_bytes).hexdigest()
    return key_id


def generate_key_pair() -> tuple[ed25519.Ed25519PrivateKey, str, str]:
    """Generate Ed25519 key pair and return private key, public hex, and key ID."""
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )
    public_hex = public_bytes.hex()
    key_id = calculate_key_id_from_public_hex(public_hex)
    
    return private_key, public_hex, key_id


def save_private_key(private_key: ed25519.Ed25519PrivateKey, filepath: Path):
    """Save private key in PEM format."""
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    filepath.write_bytes(pem)


def main():
    # Configuration from UI parameters
    output_dir = Path(".")
    app_name = "${appName}"
    admin_name = "${adminName}"
    new_root_keys_count = ${keyCount}
    
    key_dir = output_dir / "${defaultKeyDir}"
    key_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 70)
    print("Generating New Root Keys for Rotation${flowTypeSuffix}")
    print("=" * 70)
    print()
    
    # Generate new root keys
    print(f"Generating {new_root_keys_count} new root key(s)...")
    new_keys = []
    
    for i in range(new_root_keys_count):
        private_key, public_hex, key_id = generate_key_pair()
        new_keys.append({
            "private_key": private_key,
            "public_hex": public_hex,
            "key_id": key_id
        })
        print(f"  Root key {i+1}: {key_id[:16]}...")
    
    print()
    print("Saving new root keys...")
    
    # Save new keys
    saved_keys = []
    for i, key_info in enumerate(new_keys, 1):
        key_file = key_dir / key_info["key_id"]
        
        # Check if key already exists
        if key_file.exists():
            print(f"   Warning: Key file {key_info['key_id']} already exists, skipping...")
            continue
        
        save_private_key(key_info["private_key"], key_file)
        print(f"   Saved {key_info['key_id']} (root key {i})")
        saved_keys.append(key_info)
    
    if not saved_keys:
        print()
        print("   No new keys were saved (all keys already exist)")
        sys.exit(1)
    
    print()
    
    # Create key info for new keys
    new_keys_info = {
        "root_keys": [
            {
                "key_id": key_info["key_id"],
                "public_hex": key_info["public_hex"],
                "file": f"${defaultKeyDir}/{key_info['key_id']}",
                "role": "root",
                "generated_for": "rotation"
            }
            for key_info in saved_keys
        ]
    }
    
    # Save key info
    key_info_file = output_dir / f"new_root_keys_info_{app_name}_{admin_name}.json"
    with open(key_info_file, 'w') as f:
        json.dump(new_keys_info, f, indent=2)
    print(f" Saved key info: {key_info_file}")
    
    print()
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"Generated: {len(saved_keys)} new root key(s)")
    print(f"Saved to: {key_dir}/")
    print()
    print("New root keys:")
    for i, key_info in enumerate(saved_keys, 1):
        print(f"  {i}. Key ID: {key_info['key_id']}")
        print(f"     Public: {key_info['public_hex']}")
        print(f"     File:   ${defaultKeyDir}/{key_info['key_id']}")
    print()


if __name__ == "__main__":
    main()

`;
};

