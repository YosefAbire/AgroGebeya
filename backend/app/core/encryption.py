from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend
import os
import base64
from app.core.config import settings

class EncryptionService:
    """Service for encrypting and decrypting sensitive data using AES-256-GCM"""
    
    def __init__(self):
        # Get encryption key from environment or generate one for development
        key_str = getattr(settings, 'ENCRYPTION_KEY', None)
        if key_str:
            self.key = base64.b64decode(key_str)
        else:
            # Generate a key for development (should be set in production)
            self.key = AESGCM.generate_key(bit_length=256)
        
        self.aesgcm = AESGCM(self.key)
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt plaintext string using AES-256-GCM
        
        Args:
            plaintext: String to encrypt
            
        Returns:
            Base64 encoded encrypted string with nonce prepended
        """
        if not plaintext:
            return ""
        
        # Generate a random 96-bit nonce
        nonce = os.urandom(12)
        
        # Encrypt the plaintext
        ciphertext = self.aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
        
        # Prepend nonce to ciphertext and encode as base64
        encrypted_data = nonce + ciphertext
        return base64.b64encode(encrypted_data).decode('utf-8')
    
    def decrypt(self, encrypted_text: str) -> str:
        """
        Decrypt encrypted string using AES-256-GCM
        
        Args:
            encrypted_text: Base64 encoded encrypted string
            
        Returns:
            Decrypted plaintext string
        """
        if not encrypted_text:
            return ""
        
        try:
            # Decode from base64
            encrypted_data = base64.b64decode(encrypted_text)
            
            # Extract nonce (first 12 bytes) and ciphertext
            nonce = encrypted_data[:12]
            ciphertext = encrypted_data[12:]
            
            # Decrypt
            plaintext = self.aesgcm.decrypt(nonce, ciphertext, None)
            return plaintext.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Decryption failed: {str(e)}")


# Singleton instance
encryption_service = EncryptionService()
