interface UpdateKeyInfoRoleRotationScriptParams {
  appName: string;
  adminName: string;
  roleName: string;
  roleFileTag: string;
}

export const generateUpdateKeyInfoRoleRotationPythonScript = (
  params: UpdateKeyInfoRoleRotationScriptParams
): string => {
  const { appName, adminName, roleName, roleFileTag } = params;

  return `#!/usr/bin/env python3
"""
Update key_info JSON after ${roleName} key rotation.

This script replaces ${roleName}_keys in key_info with keys from
new_${roleFileTag}_keys_info and keeps threshold in sync when present.
"""

import argparse
import json
from pathlib import Path
from typing import Any, Dict


ROLE_NAME = "${roleName}"
ROLE_FILE_TAG = "${roleFileTag}"


def load_json(path: str) -> Dict[str, Any]:
    with open(path, "r") as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(description=f"Update key_info {ROLE_NAME} keys after rotation")
    parser.add_argument("--key-info", required=True, help="Path to key_info JSON file")
    parser.add_argument(
        "--new-${roleFileTag}-keys",
        required=True,
        dest="new_role_keys",
        help="Path to new role keys info JSON"
    )
    parser.add_argument(
        "--output",
        help="Output path (default: overwrite --key-info in place)"
    )
    args = parser.parse_args()

    key_info = load_json(args.key_info)
    new_role_info = load_json(args.new_role_keys)

    role_keys_field = f"{ROLE_NAME}_keys"
    role_threshold_field = f"{ROLE_NAME}_threshold"
    new_keys = new_role_info.get(role_keys_field, [])
    if not new_keys:
        raise ValueError(f"No {role_keys_field} found in new role keys info")

    key_info[role_keys_field] = [
        {
            "key_id": item["key_id"],
            "public_hex": item["public_hex"],
            "file": item["file"],
            "role": ROLE_NAME
        }
        for item in new_keys
    ]

    if role_threshold_field in new_role_info:
        key_info[role_threshold_field] = int(new_role_info[role_threshold_field])

    output_path = Path(args.output) if args.output else Path(args.key_info)
    with open(output_path, "w") as f:
        json.dump(key_info, f, indent=2)

    print(f"Updated {role_keys_field} in: {output_path}")
    print(f"New key count: {len(key_info[role_keys_field])}")


if __name__ == "__main__":
    main()
`;
};
