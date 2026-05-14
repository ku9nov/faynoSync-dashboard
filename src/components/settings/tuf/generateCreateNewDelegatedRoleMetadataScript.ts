interface CreateNewDelegatedRoleMetadataScriptParams {
  appName: string;
  adminName: string;
  roleName: string;
  roleFileTag: string;
}

export const generateCreateNewDelegatedRoleMetadataPythonScript = (
  params: CreateNewDelegatedRoleMetadataScriptParams
): string => {
  const { appName, adminName, roleName, roleFileTag } = params;

  return `#!/usr/bin/env python3
"""
Create new delegated role metadata for delegated key rotation.

This script prepares new delegated metadata (e.g. default role):
- increments version
- updates expiration
- preserves existing targets payload
- resets signatures to []
"""

import argparse
import copy
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict


def extract_metadata(doc: Dict[str, Any], role_name: str) -> Dict[str, Any]:
    if "data" in doc and "metadata" in doc["data"] and role_name in doc["data"]["metadata"]:
        return doc["data"]["metadata"][role_name]
    if "metadata" in doc and role_name in doc["metadata"]:
        return doc["metadata"][role_name]
    return doc


def create_new_delegated_metadata(current_role: Dict[str, Any], expiration_days: int) -> Dict[str, Any]:
    current_signed = current_role.get("signed", {})
    if not current_signed:
        raise ValueError("Current delegated metadata must contain 'signed'")
    if current_signed.get("_type") != "targets":
        raise ValueError(f"Expected delegated targets metadata (_type=targets), got {current_signed.get('_type')}")

    new_signed = copy.deepcopy(current_signed)
    current_version = int(new_signed.get("version", 1))
    new_signed["version"] = current_version + 1

    current_expires = datetime.fromisoformat(new_signed["expires"].replace("Z", "+00:00"))
    new_expires = current_expires + timedelta(days=expiration_days)
    new_signed["expires"] = new_expires.strftime("%Y-%m-%dT%H:%M:%SZ")

    return {"signatures": [], "signed": new_signed}


def main():
    parser = argparse.ArgumentParser(
        description="Create new delegated role metadata (unsigned) for key rotation"
    )
    parser.add_argument(
        "--current",
        default="current_${roleFileTag}_${appName}_${adminName}.json",
        help="Current delegated role metadata JSON",
    )
    parser.add_argument(
        "--role-name",
        default="${roleName}",
        help="Delegated role name (e.g. default)",
    )
    parser.add_argument(
        "--output",
        default="new_${roleFileTag}_metadata_${appName}_${adminName}.json",
        help="Output delegated metadata JSON",
    )
    parser.add_argument(
        "--expiration-days",
        type=int,
        default=90,
        help="Days to add to current delegated role expiration (default: 90)",
    )
    args = parser.parse_args()

    with open(args.current, "r") as f:
        current_doc = json.load(f)

    current_role = extract_metadata(current_doc, args.role_name)
    new_role = create_new_delegated_metadata(current_role, args.expiration_days)

    output_path = Path(args.output)
    with open(output_path, "w") as f:
        json.dump(new_role, f, indent=2)

    print("=" * 70)
    print("Delegated role metadata prepared")
    print("=" * 70)
    print(f"Role: {args.role_name}")
    print(f"Saved: {output_path}")
    print(f"Version: {new_role['signed']['version']}")
    print("Signatures: 0 (must sign with new delegated role key(s))")


if __name__ == "__main__":
    main()

`;
};
