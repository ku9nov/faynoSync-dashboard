interface GenerateSignaturesScriptParams {
  appName: string;
  adminName: string;
}

export const generateGenerateSignaturesPythonScript = (params: GenerateSignaturesScriptParams): string => {
  const { appName, adminName } = params;

  return `#!/usr/bin/env python3
"""
Generate signatures for metadata.

This script can sign metadata in two modes:
1. Single signature mode: signs with one key
2. Batch mode: signs with all keys from key info JSON files.
   When both --old-keys-info and --new-keys-info are given, updates the old
   key info file at the end: root_keys are replaced with the new keys so
   the next rotation uses the correct (new) root keys.

Usage (single signature):
    python3 generate_signatures_${appName}_${adminName}.py \\
        --metadata new_root_metadata_${appName}_${adminName}.json \\
        --key private_key_file \\
        --key-id key_id \\
        --output signature.json

Usage (batch mode):
    python3 generate_signatures_${appName}_${adminName}.py \\
        --metadata new_root_metadata_${appName}_${adminName}.json \\
        --old-keys-info key_info_${appName}_${adminName}.json \\
        --new-keys-info new_root_keys_info_${appName}_${adminName}.json
"""

import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Optional

try:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ed25519
    from cryptography.hazmat.backends import default_backend
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install cryptography")
    sys.exit(1)


def load_private_key(key_path: str) -> ed25519.Ed25519PrivateKey:
    """Load Ed25519 private key from file."""
    key_file = Path(key_path)
    if not key_file.exists():
        raise FileNotFoundError(f"Private key file not found: {key_path}")
    
    key_data = key_file.read_bytes()
    
    # Try PEM format
    try:
        private_key = serialization.load_pem_private_key(
            key_data,
            password=None,
            backend=default_backend()
        )
        if isinstance(private_key, ed25519.Ed25519PrivateKey):
            return private_key
    except Exception:
        pass
    
    # Try raw 32-byte seed
    if len(key_data) == 32:
        try:
            private_key = ed25519.Ed25519PrivateKey.from_private_bytes(key_data)
            return private_key
        except Exception:
            pass
    
    # Try hex-encoded seed
    try:
        key_hex = key_data.decode('utf-8').strip()
        if len(key_hex) == 64:
            key_bytes = bytes.fromhex(key_hex)
            private_key = ed25519.Ed25519PrivateKey.from_private_bytes(key_bytes)
            return private_key
    except Exception:
        pass
    
    raise ValueError(f"Could not load private key from {key_path}")


def generate_signature(
    metadata: Dict,
    key_path: str,
    key_id: str
) -> Dict[str, str]:
    """Generate a signature for metadata using the specified key."""
    # Get signed portion
    signed_data = metadata.get("signed", {})
    if not signed_data:
        raise ValueError("Metadata must contain 'signed' field")
    
    # Load private key
    private_key = load_private_key(key_path)
    
    # Serialize signed data to canonical JSON
    signed_json = json.dumps(signed_data, sort_keys=True, separators=(',', ':'))
    signed_bytes = signed_json.encode('utf-8')
    
    # Sign
    signature_bytes = private_key.sign(signed_bytes)
    signature_hex = signature_bytes.hex()
    
    # Create signature object
    signature = {
        "keyid": key_id,
        "sig": signature_hex
    }
    
    return signature


def load_keys_info(json_path: str) -> Dict:
    """Load keys information from JSON file."""
    keys_file = Path(json_path)
    if not keys_file.exists():
        raise FileNotFoundError(f"Keys info file not found: {json_path}")
    
    with open(keys_file, 'r') as f:
        return json.load(f)


def process_batch_mode(
    metadata_path: str,
    old_keys_info_path: Optional[str],
    new_keys_info_path: Optional[str]
) -> None:
    """Process all keys from key info files and generate signatures."""
    # Load metadata
    metadata_file = Path(metadata_path)
    if not metadata_file.exists():
        print(f"Error: Metadata file not found: {metadata_path}", file=sys.stderr)
        sys.exit(1)
    
    with open(metadata_file, 'r') as f:
        metadata = json.load(f)
    
    signature_count = 0
    
    # Process old keys
    if old_keys_info_path:
        try:
            old_keys_info = load_keys_info(old_keys_info_path)
            old_root_keys = old_keys_info.get("root_keys", [])
            
            for idx, key_info in enumerate(old_root_keys, start=1):
                key_id = key_info["key_id"]
                key_file = key_info["file"]
                output_file = f"signatureold{idx}.json"
                
                # Resolve relative paths relative to the keys info file location
                keys_info_dir = Path(old_keys_info_path).parent
                full_key_path = keys_info_dir / key_file
                
                try:
                    signature = generate_signature(metadata, str(full_key_path), key_id)
                    
                    with open(output_file, 'w') as f:
                        json.dump(signature, f, indent=2)
                    
                    print(f" Generated {output_file} for key {key_id[:16]}...")
                    signature_count += 1
                except Exception as e:
                    print(f" Error processing old key {idx} ({key_id[:16]}...): {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error loading old keys info: {e}", file=sys.stderr)
            sys.exit(1)
    
    # Process new keys
    if new_keys_info_path:
        try:
            new_keys_info = load_keys_info(new_keys_info_path)
            new_root_keys = new_keys_info.get("root_keys", [])
            
            for idx, key_info in enumerate(new_root_keys, start=1):
                key_id = key_info["key_id"]
                key_file = key_info["file"]
                output_file = f"signature{idx}.json"
                
                # Resolve relative paths relative to the keys info file location
                keys_info_dir = Path(new_keys_info_path).parent
                full_key_path = keys_info_dir / key_file
                
                try:
                    signature = generate_signature(metadata, str(full_key_path), key_id)
                    
                    with open(output_file, 'w') as f:
                        json.dump(signature, f, indent=2)
                    
                    print(f" Generated {output_file} for key {key_id[:16]}...")
                    signature_count += 1
                except Exception as e:
                    print(f" Error processing new key {idx} ({key_id[:16]}...): {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error loading new keys info: {e}", file=sys.stderr)
            sys.exit(1)
    
    if signature_count == 0:
        print("Warning: No signatures were generated. Check your key info files.", file=sys.stderr)
        sys.exit(1)
    
    print(f"\\n Successfully generated {signature_count} signature(s)")

    if old_keys_info_path and new_keys_info_path:
        key_info = load_keys_info(old_keys_info_path)
        new_keys_info = load_keys_info(new_keys_info_path)
        new_root_keys = new_keys_info.get("root_keys", [])
        key_info["root_keys"] = [
            {"key_id": k["key_id"], "public_hex": k["public_hex"], "file": k["file"], "role": k["role"]}
            for k in new_root_keys
        ]
        key_info_path = Path(old_keys_info_path)
        with open(key_info_path, "w") as f:
            json.dump(key_info, f, indent=2)
        print(f" Updated {key_info_path}: root_keys replaced with new keys ({len(new_root_keys)} key(s))")

def main():
    parser = argparse.ArgumentParser(
        description="Generate signatures for metadata",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single signature mode:
  python3 generate_signatures_${appName}_${adminName}.py \\
      --metadata new_root_metadata_${appName}_${adminName}.json \\
      --key private_key_file \\
      --key-id key_id \\
      --output signature.json

  # Batch mode (processes all keys from key info files):
  python3 generate_signatures_${appName}_${adminName}.py \\
      --metadata new_root_metadata_${appName}_${adminName}.json \\
      --old-keys-info key_info_${appName}_${adminName}.json \\
      --new-keys-info new_root_keys_info_${appName}_${adminName}.json
        """
    )
    parser.add_argument(
        "--metadata",
        required=True,
        help="Path to metadata JSON file"
    )
    
    # Single signature mode arguments
    parser.add_argument(
        "--key",
        help="Path to private key file (single signature mode)"
    )
    parser.add_argument(
        "--key-id",
        help="Key ID for the signature (single signature mode)"
    )
    parser.add_argument(
        "--output",
        help="Output path for signature JSON (single signature mode, default: print to stdout)"
    )
    
    # Batch mode arguments
    parser.add_argument(
        "--old-keys-info",
        help="Path to old keys info JSON file (batch mode)"
    )
    parser.add_argument(
        "--new-keys-info",
        help="Path to new keys info JSON file (batch mode)"
    )
    
    args = parser.parse_args()
    
    # Determine mode: batch mode if old-keys-info or new-keys-info is provided
    is_batch_mode = args.old_keys_info or args.new_keys_info
    
    if is_batch_mode:
        # Batch mode
        if not args.old_keys_info and not args.new_keys_info:
            print("Error: At least one of --old-keys-info or --new-keys-info must be provided", file=sys.stderr)
            sys.exit(1)
        
        process_batch_mode(args.metadata, args.old_keys_info, args.new_keys_info)
    else:
        # Single signature mode
        if not args.key or not args.key_id:
            print("Error: --key and --key-id are required in single signature mode", file=sys.stderr)
            print("Or use batch mode with --old-keys-info and/or --new-keys-info", file=sys.stderr)
            sys.exit(1)
        
        # Load metadata
        metadata_path = Path(args.metadata)
        if not metadata_path.exists():
            print(f"Error: Metadata file not found: {args.metadata}", file=sys.stderr)
            sys.exit(1)
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Generate signature
        try:
            signature = generate_signature(metadata, args.key, args.key_id)
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
        
        # Output
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(signature, f, indent=2)
            print(f"Signature saved to: {args.output}")
        else:
            # Print to stdout as JSON
            print(json.dumps(signature, indent=2))
        
        # Also print just the signature hex for easy copy-paste
        print(f"\\nSignature hex: {signature['sig']}", file=sys.stderr)


if __name__ == "__main__":
    main()

`;
};

