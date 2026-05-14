interface CreateNewTargetsMetadataDelegationRotationScriptParams {
  appName: string;
  adminName: string;
  roleName: string;
  roleFileTag: string;
}

export const generateCreateNewTargetsDelegationMetadataPythonScript = (
  params: CreateNewTargetsMetadataDelegationRotationScriptParams
): string => {
  const { appName, adminName, roleName, roleFileTag } = params;

  return `#!/usr/bin/env python3
"""
Create new targets metadata by rotating keys for one delegated role.

This updates only:
- signed.delegations.keys
- signed.delegations.roles[].keyids/threshold for selected role
- signed.version (+1)
- signed.expires

The resulting metadata is unsigned ("signatures": []) and must be signed by
targets role keys afterward.
"""

import argparse
import copy
import hashlib
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List

try:
    from securesystemslib.formats import encode_canonical
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install securesystemslib")
    sys.exit(1)


def calculate_key_id_from_public_value(public_value: str, key_type: str, key_scheme: str) -> str:
    key_dict = {
        "keytype": key_type,
        "scheme": key_scheme,
        "keyval": {"public": public_value},
    }
    canonical = encode_canonical(key_dict)
    canonical_bytes = canonical if isinstance(canonical, bytes) else canonical.encode("utf-8")
    return hashlib.sha256(canonical_bytes).hexdigest()


def extract_metadata(doc: Dict[str, Any], role_name: str) -> Dict[str, Any]:
    if "data" in doc and "metadata" in doc["data"] and role_name in doc["data"]["metadata"]:
        return doc["data"]["metadata"][role_name]
    if "metadata" in doc and role_name in doc["metadata"]:
        return doc["metadata"][role_name]
    return doc


def _find_role_index(delegated_roles: List[Dict[str, Any]], role_name: str) -> int:
    for i, role in enumerate(delegated_roles):
        if role.get("name") == role_name:
            return i
    return -1


def _count_key_usage(delegated_roles: List[Dict[str, Any]], key_id: str) -> int:
    count = 0
    for role in delegated_roles:
        for role_key_id in role.get("keyids", []):
            if role_key_id == key_id:
                count += 1
    return count


def _unique_key_ids(keys: List[Dict[str, Any]]) -> List[str]:
    key_ids = [k["key_id"] for k in keys]
    duplicates = {kid for kid in key_ids if key_ids.count(kid) > 1}
    if duplicates:
        raise ValueError(f"Duplicate key IDs in new delegated key set: {sorted(duplicates)}")
    return key_ids


def create_new_targets_metadata(
    current_targets: Dict[str, Any],
    new_keys_info: Dict[str, Any],
    role_name: str,
    expiration_days: int,
) -> Dict[str, Any]:
    current_signed = current_targets.get("signed", {})
    if not current_signed:
        raise ValueError("Current targets metadata must contain 'signed'")
    if current_signed.get("_type") != "targets":
        raise ValueError(f"Expected targets metadata, got: {current_signed.get('_type')}")

    new_signed = copy.deepcopy(current_signed)

    current_version = int(new_signed.get("version", 1))
    new_signed["version"] = current_version + 1

    current_expires = datetime.fromisoformat(new_signed["expires"].replace("Z", "+00:00"))
    new_expires = current_expires + timedelta(days=expiration_days)
    new_signed["expires"] = new_expires.strftime("%Y-%m-%dT%H:%M:%SZ")

    delegations = new_signed.get("delegations")
    if not delegations:
        raise ValueError("Targets metadata has no delegations block")

    delegated_roles = delegations.get("roles")
    if not isinstance(delegated_roles, list):
        raise ValueError("Targets delegations.roles must be an array")

    role_idx = _find_role_index(delegated_roles, role_name)
    if role_idx < 0:
        raise ValueError(f"Delegated role '{role_name}' not found in targets delegations.roles")

    role_entry = delegated_roles[role_idx]
    old_key_ids = list(role_entry.get("keyids", []))
    if not old_key_ids:
        raise ValueError(f"Delegated role '{role_name}' has empty keyids")

    new_delegation_keys = new_keys_info.get("delegation_keys", [])
    if not new_delegation_keys:
        raise ValueError("No delegation_keys found in new keys info")

    for item in new_delegation_keys:
        if item.get("delegation_role_name") != role_name:
            raise ValueError(
                "All new delegation keys must have delegation_role_name matching --role-name"
            )

    new_key_ids = _unique_key_ids(new_delegation_keys)
    new_threshold = int(
        new_keys_info.get("delegation_role", {}).get(
            "threshold",
            role_entry.get("threshold", len(new_key_ids))
        )
    )
    if new_threshold < 1:
        raise ValueError("delegated role threshold must be >= 1")
    if new_threshold > len(new_key_ids):
        raise ValueError(f"delegated role threshold {new_threshold} exceeds keys {len(new_key_ids)}")

    delegation_keys = delegations.get("keys")
    if not isinstance(delegation_keys, dict):
        raise ValueError("Targets delegations.keys must be an object")

    # Remove old keys only if they are not referenced by any other delegated role.
    for key_id in old_key_ids:
        still_used_count = _count_key_usage(delegated_roles, key_id)
        if still_used_count <= 1 and key_id in delegation_keys:
            del delegation_keys[key_id]

    # Add new delegated public keys with keyid consistency verification.
    for item in new_delegation_keys:
        key_id = item["key_id"]
        public_value = item.get("public") or item.get("public_hex")
        if not public_value:
            raise ValueError(f"No public key material found for key {key_id}")

        key_type = item.get("keytype", "ecdsa")
        key_scheme = item.get("scheme", "ecdsa-sha2-nistp256")

        calculated_key_id = calculate_key_id_from_public_value(
            public_value=public_value,
            key_type=key_type,
            key_scheme=key_scheme,
        )
        if calculated_key_id != key_id:
            raise ValueError(
                f"Key ID mismatch for key {key_id}: expected {key_id}, got {calculated_key_id}"
            )

        delegation_keys[key_id] = {
            "keytype": key_type,
            "scheme": key_scheme,
            "keyval": {"public": public_value},
        }

    role_entry["keyids"] = new_key_ids
    role_entry["threshold"] = new_threshold
    delegated_roles[role_idx] = role_entry
    delegations["roles"] = delegated_roles
    delegations["keys"] = delegation_keys
    new_signed["delegations"] = delegations

    return {"signatures": [], "signed": new_signed}


def main():
    parser = argparse.ArgumentParser(
        description="Create new targets metadata for delegated role key rotation"
    )
    parser.add_argument(
        "--current-targets",
        default="current_targets_${appName}_${adminName}.json",
        help="Current targets metadata JSON",
    )
    parser.add_argument(
        "--new-keys",
        default="new_${roleFileTag}_keys_info_${appName}_${adminName}.json",
        help="new_<role>_keys_info_*.json",
    )
    parser.add_argument(
        "--role-name",
        default="${roleName}",
        help="Delegated role name (e.g. default)",
    )
    parser.add_argument(
        "--output",
        default="new_targets_metadata_${appName}_${adminName}.json",
        help="Output targets metadata JSON",
    )
    parser.add_argument(
        "--expiration-days",
        type=int,
        default=365,
        help="Days to add to current targets expiration (default: 365)",
    )
    args = parser.parse_args()

    with open(args.current_targets, "r") as f:
        current_doc = json.load(f)
    with open(args.new_keys, "r") as f:
        new_keys_info = json.load(f)

    current_targets = extract_metadata(current_doc, "targets")
    new_targets = create_new_targets_metadata(
        current_targets=current_targets,
        new_keys_info=new_keys_info,
        role_name=args.role_name,
        expiration_days=args.expiration_days,
    )

    output_path = Path(args.output)
    with open(output_path, "w") as f:
        json.dump(new_targets, f, indent=2)

    print("=" * 70)
    print("Targets metadata updated for delegated key rotation")
    print("=" * 70)
    print(f"Saved: {output_path}")
    print(f"Version: {new_targets['signed']['version']}")
    print(f"Delegated role: {args.role_name}")
    print("Signatures: 0 (must sign with targets role keys)")


if __name__ == "__main__":
    main()

`;
};
