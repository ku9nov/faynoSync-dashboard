interface TufScriptParams {
  appName: string;
  keyType: string;
  roleName: string;
  adminName: string;
  expiration: {
    root: number;
    timestamp: number;
    snapshot: number;
    targets: number;
  };
  thresholds: {
    root: number;
    timestamp: number;
    snapshot: number;
    targets: number;
    delegation: number;
  };
}

export const generateTufPythonScript = (params: TufScriptParams): string => {
  const { appName, keyType: _keyType, roleName, adminName, expiration, thresholds } = params;

  return `#!/usr/bin/env python3
"""
Generate TUF keys and create bootstrap payload.

This script generates:
- 2 root keys (threshold from config)
- N timestamp keys (N = timestamp threshold)
- N snapshot keys (N = snapshot threshold)
- N targets keys (N = targets threshold)

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
        print(f"   Signed with root key {i+1} (key ID: {key_id[:16]}...)")
    
    return signatures


def create_bootstrap_payload(
    root_keys: list[tuple[str, str]],  # (key_id, public_hex)
    timestamp_keys: list[tuple[str, str]],
    snapshot_keys: list[tuple[str, str]],
    targets_keys: list[tuple[str, str]],
    root_private_keys: list[ed25519.Ed25519PrivateKey],
    root_threshold: int,
    timestamp_threshold: int,
    snapshot_threshold: int,
    targets_threshold: int,
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
    all_keys = root_keys + timestamp_keys + snapshot_keys + targets_keys
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
            "threshold": root_threshold
        },
        "timestamp": {
            "keyids": [k[0] for k in timestamp_keys],
            "threshold": timestamp_threshold
        },
        "snapshot": {
            "keyids": [k[0] for k in snapshot_keys],
            "threshold": snapshot_threshold
        },
        "targets": {
            "keyids": [k[0] for k in targets_keys],
            "threshold": targets_threshold
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
    signatures = sign_root_metadata(signed_data, root_private_keys, root_key_ids_list, root_threshold)
    
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
    root_threshold = ${thresholds.root}
    timestamp_threshold = ${thresholds.timestamp}
    snapshot_threshold = ${thresholds.snapshot}
    targets_threshold = ${thresholds.targets}
    app_name = "${appName}"
    delegation_role_name = "${roleName}"
    admin_name = "${adminName}"
    delegation_threshold = ${thresholds.delegation}
    delegation_terminating = False
    delegation_keys_count = max(1, delegation_threshold)
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
    
    # Root must have at least root_threshold keys; we generate 2 root keys
    num_root_keys = max(2, root_threshold)
    
    # Generate keys
    print("Generating keys...")
    
    # Root keys
    print(f"  Root keys ({num_root_keys} keys, threshold={root_threshold}):")
    root_keys = []
    root_private_keys = []
    for i in range(num_root_keys):
        private_key, public_hex, key_id = generate_key_pair()
        root_keys.append((key_id, public_hex))
        root_private_keys.append(private_key)
        print(f"    Root key {i+1}: {key_id[:16]}...")
    
    # Timestamp keys
    print(f"  Timestamp keys ({timestamp_threshold} keys, threshold={timestamp_threshold}):")
    timestamp_keys = []
    timestamp_private_keys = []
    for i in range(timestamp_threshold):
        private_key, public_hex, key_id = generate_key_pair()
        timestamp_keys.append((key_id, public_hex))
        timestamp_private_keys.append(private_key)
        print(f"    Timestamp key {i+1}: {key_id[:16]}...")
    
    # Snapshot keys
    print(f"  Snapshot keys ({snapshot_threshold} keys, threshold={snapshot_threshold}):")
    snapshot_keys = []
    snapshot_private_keys = []
    for i in range(snapshot_threshold):
        private_key, public_hex, key_id = generate_key_pair()
        snapshot_keys.append((key_id, public_hex))
        snapshot_private_keys.append(private_key)
        print(f"    Snapshot key {i+1}: {key_id[:16]}...")
    
    # Targets keys
    print(f"  Targets keys ({targets_threshold} keys, threshold={targets_threshold}):")
    targets_keys = []
    targets_private_keys = []
    for i in range(targets_threshold):
        private_key, public_hex, key_id = generate_key_pair()
        targets_keys.append((key_id, public_hex))
        targets_private_keys.append(private_key)
        print(f"    Targets key {i+1}: {key_id[:16]}...")
    
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
        timestamp_keys=timestamp_keys,
        snapshot_keys=snapshot_keys,
        targets_keys=targets_keys,
        root_private_keys=root_private_keys,
        root_threshold=root_threshold,
        timestamp_threshold=timestamp_threshold,
        snapshot_threshold=snapshot_threshold,
        targets_threshold=targets_threshold,
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
    
    print(f"   Root metadata signed with {root_threshold} root key(s)")
    print()
    
    # Save private keys (using key ID as filename)
    print("Saving private keys...")
    key_dir = output_dir / "private_keys"
    key_dir_root = output_dir / f"root_keys_{app_name}_{admin_name}"
    key_dir_root.mkdir(exist_ok=True)
    key_dir.mkdir(exist_ok=True)
    
    for private_key, (key_id, _) in zip(root_private_keys, root_keys):
        key_file = key_dir_root / f"{key_id}"
        save_private_key(private_key, key_file)
        print(f"   Saved {key_id} (root key)")
    
    for private_key, (key_id, _) in zip(timestamp_private_keys, timestamp_keys):
        key_file = key_dir / f"{key_id}"
        save_private_key(private_key, key_file)
        print(f"   Saved {key_id} (timestamp key)")
    
    for private_key, (key_id, _) in zip(snapshot_private_keys, snapshot_keys):
        key_file = key_dir / f"{key_id}"
        save_private_key(private_key, key_file)
        print(f"   Saved {key_id} (snapshot key)")
    
    for private_key, (key_id, _) in zip(targets_private_keys, targets_keys):
        key_file = key_dir / f"{key_id}"
        save_private_key(private_key, key_file)
        print(f"   Saved {key_id} (targets key)")
    
    # Save delegation keys if any
    if delegation_keys:
        for private_key, (key_id, _) in zip(delegation_private_keys, delegation_keys):
            key_file = key_dir / f"{key_id}"
            save_private_key(private_key, key_file)
            print(f"   Saved {key_id} (delegation key for '{delegation_role_name}')")
    
    print()
    
    # Save bootstrap payload
    payload_file = output_dir / f"bootstrap_payload_{app_name}_{admin_name}.json"
    with open(payload_file, 'w') as f:
        json.dump(payload, f, indent=2)
    print(f" Saved bootstrap payload: {payload_file}")
    
    # Save key info for reference
    key_info = {
        "root_keys": [
            {"key_id": key_id, "public_hex": public_hex, "file": f"root_keys_{app_name}_{admin_name}/{key_id}", "role": "root"}
            for key_id, public_hex in root_keys
        ],
        "root_threshold": root_threshold,
        "timestamp_keys": [
            {"key_id": key_id, "public_hex": public_hex, "file": f"private_keys/{key_id}", "role": "timestamp"}
            for key_id, public_hex in timestamp_keys
        ],
        "timestamp_threshold": timestamp_threshold,
        "snapshot_keys": [
            {"key_id": key_id, "public_hex": public_hex, "file": f"private_keys/{key_id}", "role": "snapshot"}
            for key_id, public_hex in snapshot_keys
        ],
        "snapshot_threshold": snapshot_threshold,
        "targets_keys": [
            {"key_id": key_id, "public_hex": public_hex, "file": f"private_keys/{key_id}", "role": "targets"}
            for key_id, public_hex in targets_keys
        ],
        "targets_threshold": targets_threshold
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
    
    key_info_file = output_dir / f"key_info_{app_name}_{admin_name}.json"
    with open(key_info_file, 'w') as f:
        json.dump(key_info, f, indent=2)
    print(f" Saved key info: {key_info_file}")
    
    print()
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"Root keys: {len(root_keys)} (threshold: {root_threshold})")
    print(f"Timestamp keys: {len(timestamp_keys)} (threshold: {timestamp_threshold})")
    print(f"Snapshot keys: {len(snapshot_keys)} (threshold: {snapshot_threshold})")
    print(f"Targets keys: {len(targets_keys)} (threshold: {targets_threshold})")
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
