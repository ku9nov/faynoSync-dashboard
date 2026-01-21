interface CreateNewRootMetadataScriptParams {
  appName: string;
  adminName: string;
  keyDirName?: string; // Optional: defaults to "private_keys" for online flow, or "root_keys_{appName}_{adminName}" for offline
}

export const generateCreateNewRootMetadataPythonScript = (params: CreateNewRootMetadataScriptParams): string => {
  const { appName, adminName, keyDirName } = params;
  
  // Determine key directory name
  const defaultKeyDir = keyDirName || "private_keys";
  return `#!/usr/bin/env python3
"""
Create new root metadata for rotation.

This script:
1. Loads current root metadata
2. Creates new root metadata with new root keys
3. Increments version
4. Updates expiration date
5. Signs with threshold old root keys (for trust verification)

Usage:
    python3 create_new_root_metadata_${appName}_${adminName}.py \\
        --current current_root_${appName}_${adminName}.json \\
        --new-keys new_root_keys_info_${appName}_${adminName}.json \\
        --old-keys key_info_${appName}_${adminName}.json \\
        --output new_root_metadata_${appName}_${adminName}.json
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any

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
    """Calculate TUF key ID from hex-encoded public key."""
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


def load_private_key(key_path: str) -> ed25519.Ed25519PrivateKey:
    """Load Ed25519 private key from file."""
    key_file = Path(key_path)
    if not key_file.exists():
        raise FileNotFoundError(f"Private key file not found: {key_path}")
    
    key_data = key_file.read_bytes()
    
    # Try PEM format
    try:
        private_key = serialization.load_pem_private_key(
            key_data,
            password=None,
            backend=default_backend()
        )
        if isinstance(private_key, ed25519.Ed25519PrivateKey):
            return private_key
    except Exception:
        pass
    
    # Try raw 32-byte seed
    if len(key_data) == 32:
        try:
            private_key = ed25519.Ed25519PrivateKey.from_private_bytes(key_data)
            return private_key
        except Exception:
            pass
    
    # Try hex-encoded seed
    try:
        key_hex = key_data.decode('utf-8').strip()
        if len(key_hex) == 64:
            key_bytes = bytes.fromhex(key_hex)
            private_key = ed25519.Ed25519PrivateKey.from_private_bytes(key_bytes)
            return private_key
    except Exception:
        pass
    
    raise ValueError(f"Could not load private key from {key_path}")


def sign_metadata_signed_portion(signed_data: Dict[str, Any], private_key: ed25519.Ed25519PrivateKey) -> str:
    """Sign the 'signed' portion of metadata."""
    signed_json = json.dumps(signed_data, sort_keys=True, separators=(',', ':'))
    signed_bytes = signed_json.encode('utf-8')
    signature_bytes = private_key.sign(signed_bytes)
    return signature_bytes.hex()


def create_new_root_metadata(
    current_root: Dict[str, Any],
    new_keys_info: Dict[str, Any],
    old_keys_info: Dict[str, Any],
    expiration_days: int = 365
) -> Dict[str, Any]:
    """Create new root metadata with new root keys."""
    
    # Get current signed portion
    current_signed = current_root.get("signed", {})
    if not current_signed:
        raise ValueError("Current root metadata must have 'signed' field")
    
    # Create new signed portion
    new_signed = current_signed.copy()
    
    # Increment version
    current_version = new_signed.get("version", 1)
    new_signed["version"] = current_version + 1
    print(f"Version: {current_version} -> {new_signed['version']}")
    
    # Update expiration
    current_expires = datetime.fromisoformat(new_signed["expires"].replace('Z', '+00:00'))
    new_expires = current_expires + timedelta(days=expiration_days)
    new_signed["expires"] = new_expires.strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"Expires: {new_signed['expires']}")
    
    # Get new root keys
    new_root_keys = new_keys_info.get("root_keys", [])
    if not new_root_keys:
        raise ValueError("No new root keys found in new_keys_info.json")
    
    # Get old root keys (for signing)
    old_root_keys = old_keys_info.get("root_keys", [])
    if not old_root_keys:
        raise ValueError("No old root keys found in key_info.json")
    
    # Get current keys dict
    current_keys = new_signed.get("keys", {})
    
    # Remove old root keys from keys dict
    old_root_key_ids = [key["key_id"] for key in old_root_keys]
    for old_key_id in old_root_key_ids:
        if old_key_id in current_keys:
            del current_keys[old_key_id]
            print(f"Removed old root key: {old_key_id[:16]}...")
    
    # Add new root keys to keys dict
    new_root_key_ids = []
    for new_key in new_root_keys:
        key_id = new_key["key_id"]
        public_hex = new_key["public_hex"]
        
        # Verify key ID matches public hex
        calculated_key_id = calculate_key_id_from_public_hex(public_hex)
        if calculated_key_id != key_id:
            raise ValueError(f"Key ID mismatch for {key_id[:16]}...: expected {key_id}, got {calculated_key_id}")
        
        current_keys[key_id] = {
            "keytype": "ed25519",
            "scheme": "ed25519",
            "keyval": {
                "public": public_hex
            }
        }
        new_root_key_ids.append(key_id)
        print(f"Added new root key: {key_id[:16]}...")
    
    new_signed["keys"] = current_keys
    
    # Update roles.root.keyids
    new_signed["roles"]["root"]["keyids"] = new_root_key_ids
    threshold = new_signed["roles"]["root"].get("threshold", len(new_root_key_ids))
    print(f"Root role keyids: {new_root_key_ids}")
    print(f"Root role threshold: {threshold}")
    
    # Create new metadata (unsigned for now)
    new_metadata = {
        "signatures": [],
        "signed": new_signed
    }
    
    return new_metadata, old_root_key_ids


def main():
    parser = argparse.ArgumentParser(
        description="Create new root metadata for rotation"
    )
    parser.add_argument(
        "--current",
        required=True,
        help="Path to current root metadata JSON file"
    )
    parser.add_argument(
        "--new-keys",
        required=True,
        help="Path to new_root_keys_info.json"
    )
    parser.add_argument(
        "--old-keys",
        required=True,
        help="Path to key_info.json (old keys)"
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Output path for new root metadata"
    )
    parser.add_argument(
        "--expiration-days",
        type=int,
        default=365,
        help="Expiration in days from current expiration (default: 365)"
    )
    parser.add_argument(
        "--sign-with-old-keys",
        action="store_true",
        default=True,
        help="Sign with threshold old root keys (for trust verification). Default: True"
    )
    parser.add_argument(
        "--no-sign-old-keys",
        action="store_false",
        dest="sign_with_old_keys",
        help="Don't sign with old root keys (you'll need to sign manually later)"
    )
    
    args = parser.parse_args()
    
    # Load files
    print("Loading files...")
    with open(args.current, 'r') as f:
        current_root_data = json.load(f)
    
    # Extract root metadata from response if needed
    if "data" in current_root_data and "trusted_root" in current_root_data["data"]:
        current_root = current_root_data["data"]["trusted_root"]
    elif "metadata" in current_root_data and "root" in current_root_data["metadata"]:
        current_root = current_root_data["metadata"]["root"]
    else:
        current_root = current_root_data
    
    with open(args.new_keys, 'r') as f:
        new_keys_info = json.load(f)
    
    with open(args.old_keys, 'r') as f:
        old_keys_info = json.load(f)
    
    print(f"Current root version: {current_root.get('signed', {}).get('version', 'unknown')}")
    print()
    
    # Create new root metadata
    print("Creating new root metadata...")
    new_metadata, old_root_key_ids = create_new_root_metadata(
        current_root,
        new_keys_info,
        old_keys_info,
        args.expiration_days
    )
    
    # Sign with old keys for trust verification
    # Get threshold from current root metadata
    current_root_threshold = current_root.get("signed", {}).get("roles", {}).get("root", {}).get("threshold", 1)
    old_keys_to_sign = min(current_root_threshold, len(old_keys_info["root_keys"]))
    
    if args.sign_with_old_keys:
        print()
        print(f"Signing with {old_keys_to_sign} old root key(s) for trust verification (threshold: {current_root_threshold})...")
        
        signed_count = 0
        for i in range(old_keys_to_sign):
            old_key_info = old_keys_info["root_keys"][i]
            old_key_path = f"{old_key_info['file']}"
            
            if not Path(old_key_path).exists():
                print(f"Warning: Old key file not found: {old_key_path}")
                print("You can sign it manually later using sign_metadata_online.py")
                continue
            
            try:
                old_private_key = load_private_key(old_key_path)
                signature_hex = sign_metadata_signed_portion(new_metadata["signed"], old_private_key)
                
                new_metadata["signatures"].append({
                    "keyid": old_key_info["key_id"],
                    "sig": signature_hex
                })
                signed_count += 1
                print(f"   Signed with old root key {i+1}: {old_key_info['key_id'][:16]}...")
            except Exception as e:
                print(f"   Failed to sign with old key {i+1} ({old_key_info['key_id'][:16]}...): {e}")
                print("    You can sign it manually later using sign_metadata_online.py")
        
        if signed_count > 0:
            print(f"Successfully signed with {signed_count} old root key(s)")
        else:
            print("Warning: No old keys were signed. You need to sign manually later.")
    
    # Save new metadata
    output_path = Path(args.output)
    with open(output_path, 'w') as f:
        json.dump(new_metadata, f, indent=2)
    
    print()
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"New root metadata saved to: {output_path}")
    print(f"Version: {new_metadata['signed']['version']}")
    print(f"Root key IDs: {new_metadata['signed']['roles']['root']['keyids']}")
    print(f"Signatures: {len(new_metadata['signatures'])}")
    print()
    
    # Get expected old key signatures count
    current_root_threshold = current_root.get("signed", {}).get("roles", {}).get("root", {}).get("threshold", 1)
    old_signatures_count = len([sig for sig in new_metadata["signatures"] if sig["keyid"] in old_root_key_ids])
    
    if old_signatures_count == 0:
        print(" Warning: New metadata is not signed with old root keys!")
        print("Next steps:")
        print(f"1. Sign with threshold ({current_root_threshold}) old root keys (for trust verification)")
        print("2. Sign with all new root keys (to meet threshold)")
        print("3. Use sign_metadata_online_${appName}_${adminName}.py to sign:")
        new_keys_str = " ".join([f"${defaultKeyDir}/{kid}" for kid in new_metadata['signed']['roles']['root']['keyids']])
        new_keyids_str = " ".join(new_metadata['signed']['roles']['root']['keyids'])
        print(f"""   python3 sign_metadata_online_${appName}_${adminName}.py \\
     --metadata {output_path} \\
     --keys {new_keys_str} \\
     --key-ids {new_keyids_str} \\
     --threshold {new_metadata['signed']['roles']['root']['threshold']} \\
     --old-keys {args.old_keys} \\
     --old-threshold {current_root_threshold} \\
     --update-key-info {args.old_keys} \\
     --output signed_{output_path.name}""")
    elif old_signatures_count < current_root_threshold:
        print(f" Warning: Only {old_signatures_count} old key signature(s), but threshold is {current_root_threshold}")
        print("Next steps:")
        print(f"1. Sign with remaining {current_root_threshold - old_signatures_count} old root key(s)")
        print("2. Sign with all new root keys (to meet threshold)")
        print("3. Use sign_metadata_online_${appName}_${adminName}.py to add signatures:")
        new_keys_str = " ".join([f"${defaultKeyDir}/{kid}" for kid in new_metadata['signed']['roles']['root']['keyids']])
        new_keyids_str = " ".join(new_metadata['signed']['roles']['root']['keyids'])
        remaining_old_threshold = current_root_threshold - old_signatures_count
        print(f"""   python3 sign_metadata_online_${appName}_${adminName}.py \\
     --metadata {output_path} \\
     --keys {new_keys_str} \\
     --key-ids {new_keyids_str} \\
     --threshold {new_metadata['signed']['roles']['root']['threshold']} \\
     --old-keys {args.old_keys} \\
     --old-threshold {remaining_old_threshold} \\
     --update-key-info {args.old_keys} \\
     --output signed_{output_path.name}""")
    else:
        print(f" Metadata is signed with {old_signatures_count} old root key(s) (threshold: {current_root_threshold})")
        print("Next steps:")
        print("1. Sign with all new root keys (to meet threshold)")
        print("2. Use sign_metadata_online_${appName}_${adminName}.py to add new root key signatures:")
        new_keys_str = " ".join([f"${defaultKeyDir}/{kid}" for kid in new_metadata['signed']['roles']['root']['keyids']])
        new_keyids_str = " ".join(new_metadata['signed']['roles']['root']['keyids'])
        print(f"""   python3 sign_metadata_online_${appName}_${adminName}.py \\
     --metadata {output_path} \\
     --keys {new_keys_str} \\
     --key-ids {new_keyids_str} \\
     --threshold {new_metadata['signed']['roles']['root']['threshold']} \\
     --update-key-info {args.old_keys} \\
     --output signed_{output_path.name}""")


if __name__ == "__main__":
    main()

`;
};

