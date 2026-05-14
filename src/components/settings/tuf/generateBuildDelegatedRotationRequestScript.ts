interface BuildDelegatedRotationRequestScriptParams {
  appName: string;
  adminName: string;
  roleName: string;
  roleFileTag: string;
}

export const generateBuildDelegatedRotationRequestPythonScript = (
  params: BuildDelegatedRotationRequestScriptParams
): string => {
  const { appName, adminName, roleName, roleFileTag } = params;

  return `#!/usr/bin/env python3
"""
Build request body for POST /tuf/v1/metadata/delegated/rotate.
"""

import argparse
import json
from pathlib import Path
from typing import Any, Dict


def load_json(path: str) -> Dict[str, Any]:
    with open(path, "r") as f:
        return json.load(f)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build delegated rotation API request payload")
    parser.add_argument("--role-name", default="${roleName}", help="Delegated role to rotate (e.g. default)")
    parser.add_argument(
        "--targets-metadata",
        default="new_targets_metadata_${appName}_${adminName}.json",
        help="Path to new targets metadata JSON",
    )
    parser.add_argument(
        "--delegated-metadata",
        default="new_${roleFileTag}_metadata_${appName}_${adminName}.json",
        help="Path to new delegated role metadata JSON",
    )
    parser.add_argument("--delegator", default="targets", help="Delegator role name (default: targets)")
    parser.add_argument(
        "--output",
        default="rotation_request_${roleFileTag}_${appName}_${adminName}.json",
        help="Output request JSON",
    )
    args = parser.parse_args()

    targets_doc = load_json(args.targets_metadata)
    delegated_doc = load_json(args.delegated_metadata)

    payload: Dict[str, Any] = {
        "role": args.role_name,
        "delegator": args.delegator,
        "metadata": {
            "targets": targets_doc,
            args.role_name: delegated_doc,
        },
    }

    output_path = Path(args.output)
    with open(output_path, "w") as f:
        json.dump(payload, f, indent=2)

    print(f"Saved rotation request payload: {output_path}")
    print(f"Role: {args.role_name}")
    print("Contains metadata: targets + delegated role")


if __name__ == "__main__":
    main()
`;
};
