interface SignMetadataOfflineScriptParams {
  appName: string;
  adminName: string;
}

export const generateSignMetadataOfflinePythonScript = (params: SignMetadataOfflineScriptParams): string => {
  const { appName, adminName } = params;

  return `#!/usr/bin/env python3
"""
Offline signing script for TUF delegation role metadata.

This script:
1. Loads unsigned metadata JSON
2. Signs it with private keys stored locally
3. Outputs signed metadata JSON ready for upload

Usage:
    python3 sign_metadata_offline_${appName}_${adminName}.py \\
        --metadata unsigned_metadata.json \\
        --keys key1.pem key2.pem \\
        --key-ids keyid1 keyid2 \\
        --threshold 2 \\
        --output signed_metadata.json
"""

import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Any

try:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ed25519
    from cryptography.hazmat.backends import default_backend
    import hashlib
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install cryptography")
    sys.exit(1)


def load_private_key(key_path: str) -> ed25519.Ed25519PrivateKey:
    """Load Ed25519 private key from file."""
    key_file = Path(key_path)
    if not key_file.exists():
        raise FileNotFoundError(f"Private key file not found: {key_path}")
    
    key_data = key_file.read_bytes()
    
    # Try to load as PEM format
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
    
    # Try to load as raw 32-byte seed
    if len(key_data) == 32:
        try:
            private_key = ed25519.Ed25519PrivateKey.from_private_bytes(key_data)
            return private_key
        except Exception:
            pass
    
    # Try to load as hex-encoded seed
    try:
        key_hex = key_data.decode('utf-8').strip()
        if len(key_hex) == 64:  # 32 bytes = 64 hex chars
            key_bytes = bytes.fromhex(key_hex)
            private_key = ed25519.Ed25519PrivateKey.from_private_bytes(key_bytes)
            return private_key
    except Exception:
        pass
    
    raise ValueError(f"Could not load private key from {key_path}. "
                     "Expected PEM format, raw 32 bytes, or hex-encoded seed.")


def calculate_key_id_from_public_hex(public_hex: str) -> str:
    """
    Calculate TUF key ID from hex-encoded public key.
    
    TUF key ID is SHA256 of the canonical JSON representation of the key.
    This matches how go-tuf calculates key IDs.
    """
    # Create canonical JSON representation
    key_dict = {
        "keytype": "ed25519",
        "scheme": "ed25519",
        "keyval": {
            "public": public_hex
        }
    }
    
    # Serialize to canonical JSON (sorted keys, no spaces)
    canonical_json = json.dumps(key_dict, sort_keys=True, separators=(',', ':'))
    canonical_bytes = canonical_json.encode('utf-8')
    
    # Calculate SHA256
    key_id = hashlib.sha256(canonical_bytes).hexdigest()
    return key_id


def calculate_key_id(public_key: ed25519.Ed25519PublicKey) -> str:
    """
    Calculate TUF key ID from Ed25519 public key object.
    """
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )
    public_hex = public_bytes.hex()
    return calculate_key_id_from_public_hex(public_hex)


def sign_metadata(
    metadata: Dict[str, Any],
    private_keys: List[ed25519.Ed25519PrivateKey],
    key_ids: List[str],
    threshold: int
) -> Dict[str, Any]:
    """Sign metadata with provided private keys."""
    if len(private_keys) != len(key_ids):
        raise ValueError(f"Number of keys ({len(private_keys)}) must match number of key IDs ({len(key_ids)})")
    
    if threshold > len(private_keys):
        raise ValueError(f"Threshold ({threshold}) cannot be greater than number of keys ({len(private_keys)})")
    
    # Get the "signed" portion for signing
    signed_data = metadata.get("signed", {})
    if not signed_data:
        raise ValueError("Metadata must contain 'signed' field")
    
    # Serialize signed data to canonical JSON
    signed_json = json.dumps(signed_data, sort_keys=True, separators=(',', ':'))
    signed_bytes = signed_json.encode('utf-8')
    
    # Sign with each key
    signatures = []
    for i, (private_key, key_id) in enumerate(zip(private_keys[:threshold], key_ids[:threshold])):
        signature_bytes = private_key.sign(signed_bytes)
        signature_hex = signature_bytes.hex()
        
        # Verify key ID matches
        public_key = private_key.public_key()
        calculated_key_id = calculate_key_id(public_key)
        
        if calculated_key_id != key_id:
            print(f"\\n ERROR: Key {i+1} key ID mismatch!")
            print(f"   Expected: {key_id}")
            print(f"   Got:      {calculated_key_id}")
            print(f"\\n   This means the private key does not match the public key")
            print(f"   stored in targets.delegations.keys for key ID {key_id}.")
            print(f"   Please use the correct private key that corresponds to this key ID.\\n")
            sys.exit(1)
        
        signatures.append({
            "keyid": key_id,
            "sig": signature_hex
        })
        print(f"   Signed with key {i+1} (key ID: {key_id})")
    
    # Create signed metadata
    signed_metadata = {
        "signatures": signatures,
        "signed": signed_data
    }
    
    return signed_metadata


def main():
    parser = argparse.ArgumentParser(
        description="Sign TUF delegation role metadata offline"
    )
    parser.add_argument(
        "--metadata",
        required=True,
        help="Path to unsigned metadata JSON file"
    )
    parser.add_argument(
        "--keys",
        nargs="+",
        required=True,
        help="Paths to private key files (PEM, raw bytes, or hex-encoded)"
    )
    parser.add_argument(
        "--key-ids",
        nargs="+",
        required=True,
        help="Key IDs corresponding to each private key (from targets.json)"
    )
    parser.add_argument(
        "--targets",
        help="Path to targets.json file to verify key IDs (optional)"
    )
    parser.add_argument(
        "--threshold",
        type=int,
        required=True,
        help="Number of signatures required (threshold)"
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Output path for signed metadata JSON"
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if len(args.keys) != len(args.key_ids):
        print("Error: Number of keys must match number of key IDs")
        sys.exit(1)
    
    if args.threshold > len(args.keys):
        print(f"Error: Threshold ({args.threshold}) cannot be greater than number of keys ({len(args.keys)})")
        sys.exit(1)
    
    # Load metadata
    metadata_path = Path(args.metadata)
    if not metadata_path.exists():
        print(f"Error: Metadata file not found: {args.metadata}")
        sys.exit(1)
    
    try:
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in metadata file: {e}")
        sys.exit(1)
    
    # Optionally verify key IDs against targets.json
    if args.targets:
        targets_path = Path(args.targets)
        if targets_path.exists():
            try:
                with open(targets_path, 'r') as f:
                    targets_data = json.load(f)
                delegations = targets_data.get('signed', {}).get('delegations', {})
                keys_dict = delegations.get('keys', {})
                
                print(f"\\nVerifying key IDs against {args.targets}...")
                for i, key_id in enumerate(args.key_ids):
                    if key_id in keys_dict:
                        key_info = keys_dict[key_id]
                        public_hex = key_info.get('keyval', {}).get('public', '')
                        calculated_id = calculate_key_id_from_public_hex(public_hex)
                        if calculated_id == key_id:
                            print(f"   Key {i+1} ID verified: {key_id}")
                        else:
                            print(f"   Key {i+1} ID mismatch in targets.json!")
                            print(f"     Expected: {key_id}")
                            print(f"     Got:      {calculated_id}")
                    else:
                        print(f"   Key {i+1} ID not found in targets.json: {key_id}")
            except Exception as e:
                print(f"   Failed to verify against targets.json: {e}")
    
    # Load private keys
    print(f"\\nLoading {len(args.keys)} private key(s)...")
    private_keys = []
    for key_path in args.keys:
        try:
            private_key = load_private_key(key_path)
            private_keys.append(private_key)
            print(f"   Loaded key from {key_path}")
        except Exception as e:
            print(f"   Failed to load key from {key_path}: {e}")
            sys.exit(1)
    
    # Sign metadata
    print(f"\\nSigning metadata with {args.threshold} key(s)...")
    try:
        signed_metadata = sign_metadata(
            metadata,
            private_keys,
            args.key_ids,
            args.threshold
        )
    except Exception as e:
        print(f"Error signing metadata: {e}")
        sys.exit(1)
    
    # Save signed metadata
    output_path = Path(args.output)
    try:
        with open(output_path, 'w') as f:
            json.dump(signed_metadata, f, indent=2)
        print(f"\\n Successfully signed metadata saved to: {output_path}")
    except Exception as e:
        print(f"Error writing output file: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

`;
};
