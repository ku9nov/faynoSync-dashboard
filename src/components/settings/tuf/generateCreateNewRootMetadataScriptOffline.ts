interface CreateNewRootMetadataScriptOfflineParams {
  appName: string;
  adminName: string;
  keyDirName?: string; // Optional: defaults to "root_keys_{appName}_{adminName}" for offline
}

export const generateCreateNewRootMetadataPythonScriptOffline = (params: CreateNewRootMetadataScriptOfflineParams): string => {
  const { appName, adminName } = params;
  

  return `#!/usr/bin/env python3
"""
Create new root metadata for rotation.

This script:
1. Loads current root metadata
2. Creates new root metadata with new root keys
3. Increments version
4. Updates expiration date
5. Writes metadata with empty "signatures"

Usage:
    python3 create_new_root_metadata_${appName}_${adminName}.py \\
        --current current_root_${appName}_${adminName}.json \\
        --new-keys new_root_keys_info_${appName}_${adminName}.json \\
        --old-keys key_info_${appName}_${adminName}.json \\
        --output new_root_metadata_${appName}_${adminName}.json
"""

import argparse
import hashlib
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any


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
    
    # Get old root keys (to remove from keys dict)
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
    
    new_metadata = {
        "signatures": [],
        "signed": new_signed
    }
    return new_metadata


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
    
    print("Creating new root metadata...")
    new_metadata = create_new_root_metadata(
        current_root,
        new_keys_info,
        old_keys_info,
        args.expiration_days
    )

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
    print(f"Signatures: {len(new_metadata['signatures'])} (always 0; sign via sign_metadata_offline_${appName}_${adminName}.py)")
    print()


if __name__ == "__main__":
    main()

`;
};
