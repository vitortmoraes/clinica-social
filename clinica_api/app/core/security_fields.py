import base64
import os

from cryptography.fernet import Fernet

# Use a consistent key for development/demo purposes if environment variable is not set.
# WARNING: In production, this MUST be a strong, persistent secret stored in .env or a vault.
# For simplicity in this local setup, we'll auto-generate or use a fallback if not present.
# Ideally, the user should set ENCRYPTION_KEY in their .env
DEFAULT_KEY = (
    b"YourSuperSecretKeyMustBe32BytesLen!!"  # Fallback (INSECURE) - User warned in docs
)
# Correct way is to generate one: Fernet.generate_key()

import logging

# Configure logging to file for persistence
logging.basicConfig(
    filename="encryption_debug.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# HARDCODED STABLE KEY FOR DEV ENVIRONMENT - DO NOT CHANGE WITHOUT MIGRATION
STABLE_KEY = b"u-Th6BGbh4TuhzvAGpygyX2-QOzY-VJMQGxGLfb0b7w="


class DataProtectionService:
    def __init__(self, key: str = None):
        self.key = STABLE_KEY
        self.cipher = Fernet(self.key)
        print(
            f"DEBUG: Initialized DataProtectionService with FIXED key prefix: {self.key[:5]}",
            flush=True,
        )

    def encrypt(self, text: str) -> str:
        if not text:
            return text

        # SAFETY: Prevent double encryption
        if text.startswith("gAAAA"):
            print(
                f"WARN: Attempted to encrypt already encrypted string: {text[:15]}...",
                flush=True,
            )
            return text

        try:
            encrypted_bytes = self.cipher.encrypt(text.encode())
            print(f"DEBUG: Encrypting '{text}' -> Success", flush=True)
            return encrypted_bytes.decode()
        except Exception as e:
            print(f"ERROR: Encryption failed: {e}", flush=True)
            return text

    def decrypt(self, encrypted_text: str) -> str:
        if not encrypted_text:
            return encrypted_text
        try:
            decrypted_bytes = self.cipher.decrypt(encrypted_text.encode())
            return decrypted_bytes.decode()
        except Exception as e:
            print(
                f"ERROR: Decryption FAILED for '{encrypted_text[:15]}...' using key prefix {self.key[:5]}... Error: {e}",
                flush=True,
            )
            return encrypted_text  # Return original encrypted string


# Singleton instance
data_protection = DataProtectionService()
