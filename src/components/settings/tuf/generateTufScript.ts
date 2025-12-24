interface TufScriptParams {
  appName: string;
  keyType: string;
  roleName: string;
  expiration: {
    root: number;
    timestamp: number;
    snapshot: number;
    targets: number;
  };
}

export const generateTufPythonScript = (params: TufScriptParams): string => {
  const { appName, keyType: _keyType, roleName, expiration } = params;

  return `#!/usr/bin/env python3
"""
Generate TUF keys and create bootstrap payload.

This script generates:
- 2 root keys (threshold=2)
- 1 timestamp key
- 1 snapshot key  
- 1 targets key

All keys are Ed25519. The script creates a complete bootstrap payload
with properly signed root metadata.
"""

import json
import sys
from datetime import datetime, timedelta, timezone
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


def sign_root_metadata(signed_data: dict, private_keys: list[ed25519.Ed25519PrivateKey], 
                       key_ids: list[str], threshold: int) -> list[dict]:
    """Sign root metadata with provided private keys."""
    if len(private_keys) < threshold:
        raise ValueError(f"Not enough keys: need {threshold}, have {len(private_keys)}")
    
    # Serialize signed data to canonical JSON
    signed_json = json.dumps(signed_data, sort_keys=True, separators=(',', ':'))
    signed_bytes = signed_json.encode('utf-8')
    
    signatures = []
    for i, (private_key, key_id) in enumerate(zip(private_keys[:threshold], key_ids[:threshold])):
        signature_bytes = private_key.sign(signed_bytes)
        signature_hex = signature_bytes.hex()
        
        signatures.append({
            "keyid": key_id,
            "sig": signature_hex
        })
        print(f"  ✓ Signed with root key {i+1} (key ID: {key_id[:16]}...)")
    
    return signatures


def create_bootstrap_payload(
    root_keys: list[tuple[str, str]],  # (key_id, public_hex)
    timestamp_key: tuple[str, str],
    snapshot_key: tuple[str, str],
    targets_key: tuple[str, str],
    root_private_keys: list[ed25519.Ed25519PrivateKey],
    root_expiration_days: int = 365,
    timestamp_expiration_days: int = 1,
    snapshot_expiration_days: int = 1,
    targets_expiration_days: int = 365,
    delegation_keys: list[tuple[str, str]] = None,  # (key_id, public_hex)
    delegation_role_name: str = None,
    delegation_paths: list[str] = None,
    delegation_threshold: int = 1,
    delegation_terminating: bool = False
) -> dict:
    """Create complete bootstrap payload."""
    
    # Calculate expiration dates
    now = datetime.now(timezone.utc)
    root_expires = (now + timedelta(days=root_expiration_days)).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Build keys dictionary
    keys = {}
    all_keys = root_keys + [timestamp_key, snapshot_key, targets_key]
    if delegation_keys:
        all_keys.extend(delegation_keys)
    
    for key_id, public_hex in all_keys:
        keys[key_id] = {
            "keytype": "ed25519",
            "scheme": "ed25519",
            "keyval": {
                "public": public_hex
            }
        }
    
    # Build roles dictionary
    root_key_ids = [k[0] for k in root_keys]
    roles = {
        "root": {
            "keyids": root_key_ids,
            "threshold": len(root_key_ids)  # threshold = number of root keys
        },
        "timestamp": {
            "keyids": [timestamp_key[0]],
            "threshold": 1
        },
        "snapshot": {
            "keyids": [snapshot_key[0]],
            "threshold": 1
        },
        "targets": {
            "keyids": [targets_key[0]],
            "threshold": 1
        }
    }
    
    # Create signed data
    signed_data = {
        "_type": "root",
        "version": 1,
        "spec_version": "1.0.31",
        "expires": root_expires,
        "consistent_snapshot": True,
        "keys": keys,
        "roles": roles
    }
    
    # Sign root metadata
    root_key_ids_list = [k[0] for k in root_keys]
    signatures = sign_root_metadata(signed_data, root_private_keys, root_key_ids_list, len(root_key_ids_list))
    
    # Create root metadata
    root_metadata = {
        "signatures": signatures,
        "signed": signed_data
    }
    
    # Create bootstrap payload
    settings_roles = {
        "root": {
            "expiration": root_expiration_days
        },
        "timestamp": {
            "expiration": timestamp_expiration_days
        },
        "snapshot": {
            "expiration": snapshot_expiration_days
        },
        "targets": {
            "expiration": targets_expiration_days
        }
    }
    
    # Add delegations if provided
    if delegation_keys and delegation_role_name:
        delegation_keys_dict = {}
        for key_id, public_hex in delegation_keys:
            delegation_keys_dict[key_id] = {
                "keytype": "ed25519",
                "scheme": "ed25519",
                "keyval": {
                    "public": public_hex
                }
            }
        
        delegation_key_ids = [k[0] for k in delegation_keys]
        settings_roles["delegations"] = {
            "keys": delegation_keys_dict,
            "roles": [
                {
                    "name": delegation_role_name,
                    "terminating": delegation_terminating,
                    "keyids": delegation_key_ids,
                    "threshold": delegation_threshold,
                    "paths": delegation_paths or []
                }
            ]
        }
    
    payload = {
        "settings": {
            "roles": settings_roles
        },
        "metadata": {
            "root": root_metadata
        }
    }
    
    return payload


def main():
    # Configuration from UI parameters
    output_dir = Path(".")
    root_expiration_days = ${expiration.root}
    targets_expiration_days = ${expiration.targets}
    timestamp_expiration_days = ${expiration.timestamp}
    snapshot_expiration_days = ${expiration.snapshot}
    app_name = "${appName}"
    delegation_role_name = "${roleName}"
    admin_name = "ku9n"  # Default admin name
    delegation_threshold = 1
    delegation_terminating = False
    delegation_keys_count = 1
    timeout = None
    
    # Generate default delegation paths based on app-name
    delegation_paths = [
        f"{admin_name}/{app_name}/",
        f"{app_name}-{admin_name}/",
        f"electron-builder/{app_name}-{admin_name}/",
        f"squirrel_windows/{app_name}-{admin_name}/",
    ]
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 70)
    print("Generating TUF Keys for Bootstrap")
    print("=" * 70)
    print()
    
    # Generate keys
    print("Generating keys...")
    
    # Root keys (2 keys, threshold=2)
    print("  Root keys (2 keys, threshold=2):")
    root_keys = []
    root_private_keys = []
    for i in range(2):
        private_key, public_hex, key_id = generate_key_pair()
        root_keys.append((key_id, public_hex))
        root_private_keys.append(private_key)
        print(f"    Root key {i+1}: {key_id[:16]}...")
    
    # Timestamp key
    print("  Timestamp key:")
    timestamp_private, timestamp_public, timestamp_key_id = generate_key_pair()
    timestamp_key = (timestamp_key_id, timestamp_public)
    print(f"    Timestamp: {timestamp_key_id[:16]}...")
    
    # Snapshot key
    print("  Snapshot key:")
    snapshot_private, snapshot_public, snapshot_key_id = generate_key_pair()
    snapshot_key = (snapshot_key_id, snapshot_public)
    print(f"    Snapshot: {snapshot_key_id[:16]}...")
    
    # Targets key
    print("  Targets key:")
    targets_private, targets_public, targets_key_id = generate_key_pair()
    targets_key = (targets_key_id, targets_public)
    print(f"    Targets: {targets_key_id[:16]}...")
    
    # Delegation keys (always created by default)
    delegation_keys = []
    delegation_private_keys = []
    
    print(f"  Delegation keys ({delegation_keys_count} keys for role '{delegation_role_name}'):")
    for i in range(delegation_keys_count):
        private_key, public_hex, key_id = generate_key_pair()
        delegation_keys.append((key_id, public_hex))
        delegation_private_keys.append(private_key)
        print(f"    Delegation key {i+1}: {key_id[:16]}...")
    
    print()
    print("Creating bootstrap payload...")
    
    # Create bootstrap payload
    payload = create_bootstrap_payload(
        root_keys=root_keys,
        timestamp_key=timestamp_key,
        snapshot_key=snapshot_key,
        targets_key=targets_key,
        root_private_keys=root_private_keys,
        root_expiration_days=root_expiration_days,
        timestamp_expiration_days=timestamp_expiration_days,
        snapshot_expiration_days=snapshot_expiration_days,
        targets_expiration_days=targets_expiration_days,
        delegation_keys=delegation_keys,
        delegation_role_name=delegation_role_name,
        delegation_paths=delegation_paths,
        delegation_threshold=delegation_threshold,
        delegation_terminating=delegation_terminating
    )
    
    # Add appName
    payload["appName"] = app_name
    
    # Add timeout if provided
    if timeout:
        payload["timeout"] = timeout
    
    print("  ✓ Root metadata signed with both root keys")
    print()
    
    # Save private keys (using key ID as filename)
    print("Saving private keys...")
    key_dir = output_dir / "private_keys"
    key_dir.mkdir(exist_ok=True)
    
    for private_key, (key_id, _) in zip(root_private_keys, root_keys):
        key_file = key_dir / f"{key_id}"
        save_private_key(private_key, key_file)
        print(f"  ✓ Saved {key_id} (root key)")
    
    timestamp_key_file = key_dir / f"{timestamp_key_id}"
    save_private_key(timestamp_private, timestamp_key_file)
    print(f"  ✓ Saved {timestamp_key_id} (timestamp key)")
    
    snapshot_key_file = key_dir / f"{snapshot_key_id}"
    save_private_key(snapshot_private, snapshot_key_file)
    print(f"  ✓ Saved {snapshot_key_id} (snapshot key)")
    
    targets_key_file = key_dir / f"{targets_key_id}"
    save_private_key(targets_private, targets_key_file)
    print(f"  ✓ Saved {targets_key_id} (targets key)")
    
    # Save delegation keys if any
    if delegation_keys:
        for private_key, (key_id, _) in zip(delegation_private_keys, delegation_keys):
            key_file = key_dir / f"{key_id}"
            save_private_key(private_key, key_file)
            print(f"  ✓ Saved {key_id} (delegation key for '{delegation_role_name}')")
    
    print()
    
    # Save bootstrap payload
    payload_file = output_dir / "bootstrap_payload.json"
    with open(payload_file, 'w') as f:
        json.dump(payload, f, indent=2)
    print(f"✓ Saved bootstrap payload: {payload_file}")
    
    # Save key info for reference
    key_info = {
        "root_keys": [
            {"key_id": key_id, "public_hex": public_hex, "file": f"private_keys/{key_id}", "role": "root"}
            for key_id, public_hex in root_keys
        ],
        "timestamp_key": {
            "key_id": timestamp_key_id,
            "public_hex": timestamp_public,
            "file": f"private_keys/{timestamp_key_id}",
            "role": "timestamp"
        },
        "snapshot_key": {
            "key_id": snapshot_key_id,
            "public_hex": snapshot_public,
            "file": f"private_keys/{snapshot_key_id}",
            "role": "snapshot"
        },
        "targets_key": {
            "key_id": targets_key_id,
            "public_hex": targets_public,
            "file": f"private_keys/{targets_key_id}",
            "role": "targets"
        }
    }
    
    # Add delegation keys info if any
    if delegation_keys:
        key_info["delegation_keys"] = [
            {
                "key_id": key_id,
                "public_hex": public_hex,
                "file": f"private_keys/{key_id}",
                "role": "delegation",
                "delegation_role_name": delegation_role_name
            }
            for key_id, public_hex in delegation_keys
        ]
        key_info["delegation_role"] = {
            "name": delegation_role_name,
            "paths": delegation_paths or [],
            "threshold": delegation_threshold,
            "terminating": delegation_terminating
        }
    
    key_info_file = output_dir / "key_info.json"
    with open(key_info_file, 'w') as f:
        json.dump(key_info, f, indent=2)
    print(f"✓ Saved key info: {key_info_file}")
    
    print()
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"Root keys: {len(root_keys)} (threshold: {len(root_keys)})")
    print(f"Timestamp key: 1")
    print(f"Snapshot key: 1")
    print(f"Targets key: 1")
    if delegation_keys:
        print(f"Delegation keys: {len(delegation_keys)} (role: '{delegation_role_name}', threshold: {delegation_threshold})")
    print()
    print(f"Bootstrap payload: {payload_file}")
    print(f"Private keys: {key_dir}/")
    print()



if __name__ == "__main__":
    main()


`;
};
