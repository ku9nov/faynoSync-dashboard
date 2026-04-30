import { getKeyAlgorithmConfig } from './keyAlgorithm';

interface CreateNewRootMetadataRoleRotationScriptParams {
  appName: string;
  adminName: string;
  roleName: string;
  roleFileTag: string;
  keyType: string;
}

export const generateCreateNewRootMetadataRoleRotationPythonScript = (
  params: CreateNewRootMetadataRoleRotationScriptParams
): string => {
  const { roleName, roleFileTag, keyType } = params;
  const algorithm = getKeyAlgorithmConfig(keyType);

  return `#!/usr/bin/env python3
"""
Create new root metadata for ${roleName} key rotation without rotating root keys.

This script:
1. Loads current root metadata
2. Replaces only ${roleName} role keys in root.signed.keys / root.signed.roles.${roleName}
3. Keeps root role keyids/threshold unchanged
4. Increments root metadata version and updates expiration
5. Writes unsigned metadata with empty "signatures"
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


KEY_TYPE = "${algorithm.tufKeyType}"
KEY_SCHEME = "${algorithm.tufScheme}"
ROLE_NAME = "${roleName}"
ROLE_FILE_TAG = "${roleFileTag}"


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


def extract_root_metadata(document: Dict[str, Any]) -> Dict[str, Any]:
    if "data" in document and "trusted_root" in document["data"]:
        return document["data"]["trusted_root"]
    if "metadata" in document and "root" in document["metadata"]:
        return document["metadata"]["root"]
    return document


def get_unique_key_ids(role_keys: List[Dict[str, Any]]) -> List[str]:
    key_ids = [k["key_id"] for k in role_keys]
    duplicates = {kid for kid in key_ids if key_ids.count(kid) > 1}
    if duplicates:
        raise ValueError(f"Duplicate key IDs in new {ROLE_NAME} keys: {sorted(duplicates)}")
    return key_ids


def create_new_root_metadata(
    current_root: Dict[str, Any],
    new_role_keys_info: Dict[str, Any],
    expiration_days: int
) -> Dict[str, Any]:
    current_signed = current_root.get("signed", {})
    if not current_signed:
        raise ValueError("Current root metadata must contain 'signed'")

    new_signed = copy.deepcopy(current_signed)

    current_version = int(new_signed.get("version", 1))
    new_signed["version"] = current_version + 1
    print(f"Version: {current_version} -> {new_signed['version']}")

    current_expires = datetime.fromisoformat(new_signed["expires"].replace("Z", "+00:00"))
    new_expires = current_expires + timedelta(days=expiration_days)
    new_signed["expires"] = new_expires.strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"Expires: {new_signed['expires']}")

    roles = new_signed.get("roles", {})
    if "root" not in roles:
        raise ValueError("Current root metadata must contain 'roles.root'")
    if ROLE_NAME not in roles:
        raise ValueError(f"Current root metadata must contain 'roles.{ROLE_NAME}'")

    original_root_role = copy.deepcopy(current_signed["roles"]["root"])
    current_role_key_ids = list(roles[ROLE_NAME].get("keyids", []))
    if not current_role_key_ids:
        raise ValueError(f"Current root roles.{ROLE_NAME}.keyids is empty")

    role_keys_field = f"{ROLE_NAME}_keys"
    role_threshold_field = f"{ROLE_NAME}_threshold"
    new_role_keys = new_role_keys_info.get(role_keys_field, [])
    if not new_role_keys:
        raise ValueError(f"No {role_keys_field} found in new role keys info file")

    new_role_key_ids = get_unique_key_ids(new_role_keys)

    new_role_threshold = int(
        new_role_keys_info.get(
            role_threshold_field,
            roles[ROLE_NAME].get("threshold", len(new_role_key_ids))
        )
    )
    if new_role_threshold < 1:
        raise ValueError(f"{ROLE_NAME} threshold must be >= 1")
    if new_role_threshold > len(new_role_key_ids):
        raise ValueError(
            f"{ROLE_NAME} threshold {new_role_threshold} exceeds key count {len(new_role_key_ids)}"
        )

    keys_dict = new_signed.get("keys", {})

    all_other_role_key_ids = set()
    for role_name, role_info in roles.items():
        if role_name == ROLE_NAME:
            continue
        all_other_role_key_ids.update(role_info.get("keyids", []))

    for old_key_id in current_role_key_ids:
        if old_key_id in keys_dict and old_key_id not in all_other_role_key_ids:
            del keys_dict[old_key_id]
            print(f"Removed old {ROLE_NAME} key: {old_key_id[:16]}...")

    for key_info in new_role_keys:
        key_id = key_info["key_id"]
        public_value = key_info.get("public") or key_info.get("public_hex")
        if not public_value:
            raise ValueError(f"No public key material for key {key_id}")

        calculated_key_id = calculate_key_id_from_public_value(public_value)
        if calculated_key_id != key_id:
            raise ValueError(
                f"Key ID mismatch for {key_id}: expected {key_id}, got {calculated_key_id}"
            )

        keys_dict[key_id] = {
            "keytype": KEY_TYPE,
            "scheme": KEY_SCHEME,
            "keyval": {
                "public": public_value
            }
        }
        print(f"Added new {ROLE_NAME} key: {key_id[:16]}...")

    new_signed["keys"] = keys_dict
    new_signed["roles"][ROLE_NAME]["keyids"] = new_role_key_ids
    new_signed["roles"][ROLE_NAME]["threshold"] = new_role_threshold

    if new_signed["roles"]["root"] != original_root_role:
        raise ValueError("Root role changed unexpectedly; this flow must not rotate root keys")

    return {
        "signatures": [],
        "signed": new_signed
    }


def main():
    parser = argparse.ArgumentParser(
        description=f"Create new root metadata for {ROLE_NAME} key rotation (without root key rotation)"
    )
    parser.add_argument("--current", required=True, help="Path to current root metadata JSON")
    parser.add_argument(
        "--new-${roleFileTag}-keys",
        required=True,
        dest="new_role_keys",
        help="Path to new role keys info JSON"
    )
    parser.add_argument("--output", required=True, help="Path to output root metadata JSON")
    parser.add_argument(
        "--expiration-days",
        type=int,
        default=365,
        help="Days to add to current root expiration (default: 365)"
    )
    args = parser.parse_args()

    with open(args.current, "r") as f:
        current_doc = json.load(f)
    with open(args.new_role_keys, "r") as f:
        new_role_keys_info = json.load(f)

    current_root = extract_root_metadata(current_doc)
    print(f"Current root version: {current_root.get('signed', {}).get('version', 'unknown')}")
    print(f"Creating new root metadata with rotated {ROLE_NAME} key(s)...")

    new_root_metadata = create_new_root_metadata(
        current_root=current_root,
        new_role_keys_info=new_role_keys_info,
        expiration_days=args.expiration_days
    )

    output_path = Path(args.output)
    with open(output_path, "w") as f:
        json.dump(new_root_metadata, f, indent=2)

    print()
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"Saved: {output_path}")
    print(f"Version: {new_root_metadata['signed']['version']}")
    print(f"Root role keyids unchanged: {new_root_metadata['signed']['roles']['root']['keyids']}")
    print(f"{ROLE_NAME} role keyids: {new_root_metadata['signed']['roles'][ROLE_NAME]['keyids']}")
    print("Signatures: 0 (sign with generate_signatures script using root keys)")
    print()


if __name__ == "__main__":
    main()
`;
};
