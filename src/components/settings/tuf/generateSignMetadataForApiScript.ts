interface SignMetadataForApiScriptParams {
  appName: string;
  adminName: string;
  roleName: string;
  roleFileTag?: string;
}

export const generateSignMetadataForApiPythonScript = (params: SignMetadataForApiScriptParams): string => {
  const { appName, adminName, roleName, roleFileTag } = params;

  return `#!/usr/bin/env python3
"""
Generate a TUF metadata signature payload for POST /tuf/v1/metadata/sign.

This script signs canonical JSON of the "signed" object and writes:
{
  "role": "<role>",
  "signature": {
    "keyid": "<keyid>",
    "sig": "<hex DER signature>"
  }
}
"""

import argparse
import binascii
import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

try:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec, ed25519, padding, rsa
    from securesystemslib.formats import encode_canonical
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install cryptography securesystemslib")
    sys.exit(1)


def load_json(path: str) -> Dict[str, Any]:
    with open(path, "r") as f:
        return json.load(f)


def load_private_key(path: Path):
    pem = path.read_bytes()
    return serialization.load_pem_private_key(pem, password=None)


def default_key_params_from_algorithm(algorithm: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    normalized = (algorithm or "").strip().lower()
    if normalized == "ed25519":
        return "ed25519", "ed25519"
    if normalized == "rsa":
        return "rsa", "rsassa-pss-sha256"
    if normalized == "ecdsa":
        return "ecdsa", "ecdsa-sha2-nistp256"
    return None, None


def infer_key_params_from_private_key(private_key) -> Tuple[str, str, str]:
    public_key = private_key.public_key()
    if isinstance(public_key, ed25519.Ed25519PublicKey):
        public_value = public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        ).hex()
        return "ed25519", "ed25519", public_value
    if isinstance(public_key, rsa.RSAPublicKey):
        public_value = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("utf-8")
        return "rsa", "rsassa-pss-sha256", public_value
    if isinstance(public_key, ec.EllipticCurvePublicKey):
        public_value = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("utf-8")
        return "ecdsa", "ecdsa-sha2-nistp256", public_value
    raise ValueError("Unsupported private key type")


def calculate_key_id_from_public_value(public_value: str, key_type: str, key_scheme: str) -> str:
    key_dict = {
        "keytype": key_type,
        "scheme": key_scheme,
        "keyval": {"public": public_value},
    }
    canonical = encode_canonical(key_dict)
    canonical_bytes = canonical if isinstance(canonical, bytes) else canonical.encode("utf-8")
    import hashlib
    return hashlib.sha256(canonical_bytes).hexdigest()


def sign_signed_payload(metadata_doc: Dict[str, Any], private_key) -> str:
    signed = metadata_doc.get("signed")
    if not isinstance(signed, dict):
        raise ValueError("metadata must contain object field 'signed'")

    canonical = encode_canonical(signed)
    canonical_bytes = canonical if isinstance(canonical, bytes) else canonical.encode("utf-8")

    if isinstance(private_key, ed25519.Ed25519PrivateKey):
        signature = private_key.sign(canonical_bytes)
    elif isinstance(private_key, rsa.RSAPrivateKey):
        signature = private_key.sign(
            canonical_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=hashes.SHA256().digest_size,
            ),
            hashes.SHA256(),
        )
    elif isinstance(private_key, ec.EllipticCurvePrivateKey):
        signature = private_key.sign(canonical_bytes, ec.ECDSA(hashes.SHA256()))
    else:
        raise ValueError("Unsupported private key type")

    return binascii.hexlify(signature).decode("ascii")


def resolve_signer_from_sources(
    role: str,
    key_info_path: Optional[str],
    new_keys_path: Optional[str],
    key_index: int,
    base_dir: Path,
) -> Tuple[str, Path, Optional[str], Optional[str]]:
    if key_index < 0:
        raise ValueError("--key-index must be >= 0")

    if role == "targets":
        if not key_info_path:
            raise ValueError("for role=targets provide --key-info (or explicit --key and --key-id)")
        key_info = load_json(key_info_path)
        targets_keys = key_info.get("targets_keys", [])
        if not isinstance(targets_keys, list) or not targets_keys:
            raise ValueError("key_info has no targets_keys")
        if key_index >= len(targets_keys):
            raise ValueError(f"key-index {key_index} out of range for targets_keys size {len(targets_keys)}")
        selected = targets_keys[key_index]
        key_id = selected.get("key_id")
        key_file = selected.get("file")
        if not key_id or not key_file:
            raise ValueError("targets key entry must contain key_id and file")
        key_type = selected.get("keytype")
        key_scheme = selected.get("scheme")
        if not key_type or not key_scheme:
            inferred_type, inferred_scheme = default_key_params_from_algorithm(key_info.get("algorithm"))
            key_type = key_type or inferred_type
            key_scheme = key_scheme or inferred_scheme
        return key_id, (base_dir / key_file).resolve(), key_type, key_scheme

    if not new_keys_path:
        raise ValueError("for delegated roles provide --new-keys (or explicit --key and --key-id)")

    new_keys = load_json(new_keys_path)
    delegation_keys = new_keys.get("delegation_keys", [])
    if not isinstance(delegation_keys, list) or not delegation_keys:
        raise ValueError("new_keys has no delegation_keys")

    matching = [k for k in delegation_keys if k.get("delegation_role_name") == role]
    if not matching:
        raise ValueError(f"no delegation_keys found for role '{role}' in --new-keys")
    if key_index >= len(matching):
        raise ValueError(f"key-index {key_index} out of range for role '{role}' keys size {len(matching)}")

    selected = matching[key_index]
    key_id = selected.get("key_id")
    key_file = selected.get("file")
    if not key_id or not key_file:
        raise ValueError("delegation key entry must contain key_id and file")
    key_type = selected.get("keytype")
    key_scheme = selected.get("scheme")
    return key_id, (base_dir / key_file).resolve(), key_type, key_scheme


def verify_key_id_matches_material(
    private_key,
    expected_key_id: Optional[str],
    expected_key_type: Optional[str],
    expected_key_scheme: Optional[str],
) -> str:
    inferred_type, inferred_scheme, public_value = infer_key_params_from_private_key(private_key)
    key_type = expected_key_type or inferred_type
    key_scheme = expected_key_scheme or inferred_scheme

    if expected_key_type and expected_key_type != inferred_type:
        raise ValueError(
            f"Key type mismatch: expected {expected_key_type}, got {inferred_type} from private key material"
        )

    calculated_key_id = calculate_key_id_from_public_value(
        public_value=public_value,
        key_type=key_type,
        key_scheme=key_scheme,
    )
    if expected_key_id and calculated_key_id != expected_key_id:
        raise ValueError(
            f"Key ID mismatch: expected {expected_key_id}, got {calculated_key_id}"
        )
    return expected_key_id or calculated_key_id


def main() -> None:
    parser = argparse.ArgumentParser(description="Sign TUF metadata for /metadata/sign API")
    parser.add_argument(
        "--metadata",
        default="new_${roleFileTag ?? 'delegated'}_metadata_${appName}_${adminName}.json",
        help="Path to metadata JSON to sign",
    )
    parser.add_argument(
        "--role",
        default="${roleName}",
        help="Role name for API payload (e.g. targets, default)",
    )
    parser.add_argument("--key", help="Path to PEM private key (explicit mode)")
    parser.add_argument("--key-id", help="TUF keyid corresponding to --key (explicit mode, optional)")
    parser.add_argument(
        "--key-info",
        default="key_info_${appName}_${adminName}.json",
        help="Path to key_info JSON (auto mode for targets)",
    )
    parser.add_argument(
        "--new-keys",
        default="new_${roleFileTag ?? 'delegated'}_keys_info_${appName}_${adminName}.json",
        help="Path to new_<role>_keys_info_*.json (auto mode for delegated)",
    )
    parser.add_argument("--key-index", type=int, default=0, help="Index in selected key list (default: 0)")
    parser.add_argument(
        "--keys-base-dir",
        default=str(Path(__file__).resolve().parent),
        help="Base directory to resolve relative key file paths from JSON",
    )
    parser.add_argument(
        "--output",
        default="sign_payload_${roleFileTag ?? 'delegated'}_${appName}_${adminName}.json",
        help="Output JSON payload file",
    )
    args = parser.parse_args()

    metadata_doc = load_json(args.metadata)
    base_dir = Path(args.keys_base_dir).resolve()

    expected_key_type: Optional[str] = None
    expected_key_scheme: Optional[str] = None
    if args.key:
        key_path = Path(args.key).resolve()
        key_id = args.key_id
    else:
        key_id, key_path, expected_key_type, expected_key_scheme = resolve_signer_from_sources(
            role=args.role,
            key_info_path=args.key_info,
            new_keys_path=args.new_keys,
            key_index=args.key_index,
            base_dir=base_dir,
        )

    private_key = load_private_key(key_path)
    resolved_key_id = verify_key_id_matches_material(
        private_key=private_key,
        expected_key_id=key_id,
        expected_key_type=expected_key_type,
        expected_key_scheme=expected_key_scheme,
    )
    signature_hex = sign_signed_payload(metadata_doc, private_key)
    payload = {
        "role": args.role,
        "signature": {
            "keyid": resolved_key_id,
            "sig": signature_hex,
        },
    }

    output_path = Path(args.output)
    with open(output_path, "w") as f:
        json.dump(payload, f, indent=2)

    print(f"Saved signature payload: {output_path}")
    print(f"Role: {args.role}")
    print(f"KeyID: {resolved_key_id}")
    print(f"Key file: {key_path}")


if __name__ == "__main__":
    main()

`;
};
