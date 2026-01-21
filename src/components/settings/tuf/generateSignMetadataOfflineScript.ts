interface SignMetadataOfflineScriptParams {
  appName: string;
  adminName: string;
}

export const generateSignMetadataOfflinePythonScript = (params: SignMetadataOfflineScriptParams): string => {
  const { appName, adminName } = params;

  return `#!/usr/bin/env python3
"""
Offline signing script for TUF metadata with support for root key rotation.

This script:
1. Loads metadata JSON (unsigned or partially signed)
2. Signs it with new private keys stored locally
3. Optionally adds signatures from old root keys (for root rotation)
4. Outputs signed metadata JSON ready for upload

Usage (basic signing):
    python3 sign_metadata_offline_${appName}_${adminName}.py \\
        --metadata unsigned_metadata.json \\
        --keys key1.pem key2.pem \\
        --key-ids keyid1 keyid2 \\
        --threshold 2 \\
        --output signed_metadata.json

Usage (with root rotation - adds old key signatures and updates key_info):
    python3 sign_metadata_offline_${appName}_${adminName}.py \\
        --metadata unsigned_metadata.json \\
        --keys new_key1.pem new_key2.pem \\
        --key-ids new_keyid1 new_keyid2 \\
        --threshold 2 \\
        --old-keys key_info_${appName}_${adminName}.json \\
        --update-key-info key_info_${appName}_${adminName}.json \\
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


def sign_metadata_signed_portion(signed_data: Dict[str, Any], private_key: ed25519.Ed25519PrivateKey) -> str:
    """Sign the 'signed' portion of metadata."""
    signed_json = json.dumps(signed_data, sort_keys=True, separators=(',', ':'))
    signed_bytes = signed_json.encode('utf-8')
    signature_bytes = private_key.sign(signed_bytes)
    return signature_bytes.hex()


def sign_metadata(
    metadata: Dict[str, Any],
    private_keys: List[ed25519.Ed25519PrivateKey],
    key_ids: List[str],
    threshold: int,
    existing_signatures: List[Dict[str, str]] = None
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
    
    # Get existing signatures if provided
    if existing_signatures is None:
        existing_signatures = metadata.get("signatures", [])
    
    existing_key_ids = {sig["keyid"] for sig in existing_signatures}
    
    # Serialize signed data to canonical JSON
    signed_json = json.dumps(signed_data, sort_keys=True, separators=(',', ':'))
    signed_bytes = signed_json.encode('utf-8')
    
    # Sign with each key
    new_signatures = []
    for i, (private_key, key_id) in enumerate(zip(private_keys[:threshold], key_ids[:threshold])):
        # Skip if already signed
        if key_id in existing_key_ids:
            print(f"   Key {i+1} (key ID: {key_id[:16]}...) already signed, skipping")
            continue
        
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
        
        new_signatures.append({
            "keyid": key_id,
            "sig": signature_hex
        })
        print(f"   Signed with key {i+1} (key ID: {key_id[:16]}...)")
    
    # Combine existing and new signatures
    all_signatures = existing_signatures + new_signatures
    
    # Create signed metadata
    signed_metadata = {
        "signatures": all_signatures,
        "signed": signed_data
    }
    
    return signed_metadata


def add_old_key_signatures(
    metadata: Dict[str, Any],
    old_keys_info: Dict[str, Any],
    old_threshold: int = None
) -> Dict[str, Any]:
    """Add signatures from old root keys to metadata."""
    old_root_keys = old_keys_info.get("root_keys", [])
    if not old_root_keys:
        raise ValueError("No old root keys found in old_keys_info")
    
    # Get threshold
    if old_threshold is None:
        old_threshold = len(old_root_keys)
    
    # Get signed portion
    signed_data = metadata.get("signed", {})
    if not signed_data:
        raise ValueError("Metadata must contain 'signed' field")
    
    # Get existing signatures
    existing_signatures = metadata.get("signatures", [])
    existing_key_ids = {sig["keyid"] for sig in existing_signatures}
    
    print(f"\\nAdding signatures from {min(old_threshold, len(old_root_keys))} old root key(s)...")
    new_signatures = []
    signed_count = 0
    
    for i in range(min(old_threshold, len(old_root_keys))):
        old_key_info = old_root_keys[i]
        old_key_id = old_key_info["key_id"]
        
        # Skip if already signed
        if old_key_id in existing_key_ids:
            print(f"   Old key {i+1} ({old_key_id[:16]}...) already signed, skipping")
            continue
        
        old_key_path = f"{old_key_info['file']}"
        
        if not Path(old_key_path).exists():
            print(f"   Warning: Old key file not found: {old_key_path}")
            continue
        
        try:
            old_private_key = load_private_key(old_key_path)
            signature_hex = sign_metadata_signed_portion(signed_data, old_private_key)
            
            new_signatures.append({
                "keyid": old_key_id,
                "sig": signature_hex
            })
            signed_count += 1
            print(f"   Signed with old root key {i+1}: {old_key_id[:16]}...")
        except Exception as e:
            print(f"   Failed to sign with old key {i+1}: {e}")
    
    # Combine all signatures
    all_signatures = existing_signatures + new_signatures
    
    # Create updated metadata
    updated_metadata = {
        "signatures": all_signatures,
        "signed": signed_data
    }
    
    return updated_metadata, signed_count


def update_key_info_file(
    key_info_path: Path,
    new_key_ids: List[str],
    new_key_paths: List[str],
    signed_metadata: Dict[str, Any]
) -> bool:
    """
    Update key_info file with new root keys after rotation.
    
    Args:
        key_info_path: Path to key_info JSON file
        new_key_ids: List of new root key IDs
        new_key_paths: List of paths to new private key files
        signed_metadata: Signed metadata containing public keys
    
    Returns:
        True if update was successful, False otherwise
    """
    if not key_info_path.exists():
        print(f"\\nWarning: Key info file not found: {key_info_path}")
        print("Skipping key info update...")
        return False
    
    try:
        # Load existing key info
        with open(key_info_path, 'r') as f:
            key_info = json.load(f)
    except Exception as e:
        print(f"\\nWarning: Failed to load key info file: {e}")
        return False
    
    # Get public keys from signed metadata
    signed_data = signed_metadata.get("signed", {})
    keys_dict = signed_data.get("keys", {})
    
    # Get root role keyids to verify these are root keys
    root_keyids = signed_data.get("roles", {}).get("root", {}).get("keyids", [])
    
    # Extract new root keys info
    new_root_keys = []
    for key_id, key_path in zip(new_key_ids, new_key_paths):
        if key_id not in root_keyids:
            print(f"   Warning: Key {key_id[:16]}... is not in root role keyids, skipping")
            continue
        
        if key_id not in keys_dict:
            print(f"   Warning: Public key not found in metadata for {key_id[:16]}..., skipping")
            continue
        
        key_info_dict = keys_dict[key_id]
        public_hex = key_info_dict.get("keyval", {}).get("public", "")
        
        if not public_hex:
            print(f"   Warning: Public key hex not found for {key_id[:16]}..., skipping")
            continue
        
        # Normalize key path (ensure it's relative to key_info file location)
        # Key path should be like "private_keys/key_id"
        key_path_obj = Path(key_path)
        if key_id in key_path_obj.name:
            # If key_id is in filename, use it directly
            key_path_str = f"root_keys_${appName}_${adminName}/{key_id}"
        else:
            # Extract just the filename if it's a full path
            key_filename = key_path_obj.name
            key_path_str = f"root_keys_${appName}_${adminName}/{key_filename}"
        
        new_root_keys.append({
            "key_id": key_id,
            "public_hex": public_hex,
            "file": key_path_str,
            "role": "root"
        })
    
    if not new_root_keys:
        print(f"\\nWarning: No new root keys to add to key_info file")
        return False
    
    # Update root_keys in key_info (replace old ones with new ones)
    # For rotation, we replace all root keys with new ones
    key_info["root_keys"] = new_root_keys
    
    # Save updated key info
    try:
        with open(key_info_path, 'w') as f:
            json.dump(key_info, f, indent=2)
        print(f"\\n✓ Updated key_info file: {key_info_path}")
        print(f"  Added {len(new_root_keys)} new root key(s)")
        return True
    except Exception as e:
        print(f"\\nWarning: Failed to save updated key_info file: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Sign TUF metadata offline with new keys and optionally add old key signatures"
    )
    parser.add_argument(
        "--metadata",
        required=True,
        help="Path to metadata JSON file (unsigned or partially signed)"
    )
    parser.add_argument(
        "--keys",
        nargs="+",
        required=True,
        help="Paths to private key files for new keys (PEM, raw bytes, or hex-encoded)"
    )
    parser.add_argument(
        "--key-ids",
        nargs="+",
        required=True,
        help="Key IDs corresponding to each private key (from root metadata)"
    )
    parser.add_argument(
        "--targets",
        help="Path to targets.json file to verify key IDs (optional)"
    )
    parser.add_argument(
        "--threshold",
        type=int,
        required=True,
        help="Number of signatures required for new keys (threshold)"
    )
    parser.add_argument(
        "--old-keys",
        help="Path to key_info.json with old root keys (optional, for root rotation)"
    )
    parser.add_argument(
        "--old-threshold",
        type=int,
        help="Number of old keys to sign with (default: all available old keys)"
    )
    parser.add_argument(
        "--update-key-info",
        help="Path to key_info JSON file to update with new root keys after rotation (optional)"
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
    
    # Sign metadata with new keys
    print(f"\\nSigning metadata with {args.threshold} new key(s)...")
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
    
    # Add old key signatures if provided (for root rotation)
    if args.old_keys:
        old_keys_path = Path(args.old_keys)
        if not old_keys_path.exists():
            print(f"\\nWarning: Old keys file not found: {args.old_keys}")
            print("Skipping old key signatures...")
        else:
            try:
                with open(old_keys_path, 'r') as f:
                    old_keys_info = json.load(f)
                
                updated_metadata, old_signed_count = add_old_key_signatures(
                    signed_metadata,
                    old_keys_info,
                    args.old_threshold
                )
                signed_metadata = updated_metadata
                
                if old_signed_count > 0:
                    print(f"\\nSuccessfully added {old_signed_count} old key signature(s)")
                else:
                    print(f"\\nWarning: No old key signatures were added")
            except Exception as e:
                print(f"\\nWarning: Failed to add old key signatures: {e}")
                print("Continuing with new key signatures only...")
    
    # Update key_info file with new root keys (if this is root rotation)
    if args.update_key_info:
        key_info_path = Path(args.update_key_info)
        # Check if this is root metadata by checking if signed.roles.root exists
        signed_data = signed_metadata.get("signed", {})
        if signed_data.get("roles", {}).get("root"):
            # This is root metadata, update key_info
            update_key_info_file(
                key_info_path,
                args.key_ids,
                args.keys,
                signed_metadata
            )
        else:
            print(f"\\nNote: Not root metadata, skipping key_info update")
    
    # Save signed metadata
    output_path = Path(args.output)
    try:
        with open(output_path, 'w') as f:
            json.dump(signed_metadata, f, indent=2)
        
        print()
        print("=" * 70)
        print("Summary")
        print("=" * 70)
        print(f"Total signatures: {len(signed_metadata['signatures'])}")
        if args.old_keys:
            new_sig_count = len([sig for sig in signed_metadata['signatures'] if sig['keyid'] in args.key_ids])
            old_sig_count = len(signed_metadata['signatures']) - new_sig_count
            print(f"  - New keys: {new_sig_count}")
            print(f"  - Old keys: {old_sig_count}")
        print(f"Output saved to: {output_path}")
    except Exception as e:
        print(f"Error writing output file: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

`;
};
