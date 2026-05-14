interface UpdateKeyInfoDelegatedRotationScriptParams {
  appName: string;
  adminName: string;
  roleName: string;
  roleFileTag: string;
}

export const generateUpdateKeyInfoDelegatedRotationPythonScript = (
  params: UpdateKeyInfoDelegatedRotationScriptParams
): string => {
  const { appName, adminName, roleName, roleFileTag } = params;

  return `#!/usr/bin/env python3
"""
Update key_info JSON after delegated role key rotation.

Replaces delegation_keys entries for selected delegated role with new keys.
"""

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List


def load_json(path: str) -> Dict[str, Any]:
    with open(path, "r") as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(
        description="Update key_info delegation keys for one delegated role"
    )
    parser.add_argument(
        "--key-info",
        default="key_info_${appName}_${adminName}.json",
        help="Path to key_info JSON",
    )
    parser.add_argument(
        "--new-keys",
        default="new_${roleFileTag}_keys_info_${appName}_${adminName}.json",
        help="Path to new_<role>_keys_info_*.json",
    )
    parser.add_argument(
        "--role-name",
        default="${roleName}",
        help="Delegated role name",
    )
    parser.add_argument("--output", help="Output path (default: overwrite --key-info)")
    args = parser.parse_args()

    key_info = load_json(args.key_info)
    new_keys_info = load_json(args.new_keys)

    role_name = args.role_name
    new_delegation_keys = new_keys_info.get("delegation_keys", [])
    if not new_delegation_keys:
        raise ValueError("No delegation_keys found in --new-keys file")
    new_key_ids = [item.get("key_id") for item in new_delegation_keys]
    if any(not key_id for key_id in new_key_ids):
        raise ValueError("Each delegation_keys entry in --new-keys must contain non-empty key_id")
    if len(set(new_key_ids)) != len(new_key_ids):
        raise ValueError("Duplicate key_id detected in --new-keys delegation_keys")

    for item in new_delegation_keys:
        if item.get("delegation_role_name") != role_name:
            raise ValueError("All --new-keys entries must match --role-name")

    existing_keys: List[Dict[str, Any]] = key_info.get("delegation_keys", [])
    if not isinstance(existing_keys, list):
        existing_keys = []

    preserved = [
        k for k in existing_keys
        if k.get("delegation_role_name") != role_name
    ]

    replacement = [
        {
            "key_id": k["key_id"],
            "public_hex": k["public_hex"],
            "file": k["file"],
            "role": "delegation",
            "delegation_role_name": role_name,
        }
        for k in new_delegation_keys
    ]

    key_info["delegation_keys"] = preserved + replacement

    # Project currently stores one delegation_role object.
    # Keep structure and update if it points to current role.
    threshold = int(new_keys_info.get("delegation_role", {}).get("threshold", len(replacement)))
    delegation_role = key_info.get("delegation_role")
    if isinstance(delegation_role, dict):
        if delegation_role.get("name") == role_name:
            delegation_role["threshold"] = threshold
            key_info["delegation_role"] = delegation_role

    output_path = Path(args.output) if args.output else Path(args.key_info)
    with open(output_path, "w") as f:
        json.dump(key_info, f, indent=2)

    print(f"Updated key info: {output_path}")
    print(f"Delegated role: {role_name}")
    print(f"New keys for role: {len(replacement)}")


if __name__ == "__main__":
    main()
`;
};
