"""
Azure Blob Storage service for handling image uploads and management.
Optimized for low-latency uploads with proper timeout handling.
"""

import os
import uuid
import requests
from io import BytesIO
from datetime import datetime, timedelta
from azure.storage.blob import BlobServiceClient, ContentSettings, generate_blob_sas, BlobSasPermissions
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Timeout configurations for low latency
DOWNLOAD_TIMEOUT = 15  # seconds for downloading from DALL-E
UPLOAD_TIMEOUT = 30  # seconds for uploading to blob storage
CONNECTION_TIMEOUT = 10  # seconds for initial connection

class BlobStorageService:
    def __init__(self):
        """Initialize Azure Blob Storage client with optimized settings."""
        connection_string = os.environ.get('AzureWebJobsStorage')
        if not connection_string:
            raise ValueError("AzureWebJobsStorage environment variable not set")
        
        # Create client with connection timeout
        self.blob_service_client = BlobServiceClient.from_connection_string(
            connection_string,
            connection_timeout=CONNECTION_TIMEOUT,
            read_timeout=UPLOAD_TIMEOUT
        )
        self.container_name = "storyboard-images"
        
        # Extract account name and key from connection string for SAS generation
        conn_parts = dict(item.split('=', 1) for item in connection_string.split(';') if '=' in item)
        self.account_name = conn_parts.get('AccountName')
        self.account_key = conn_parts.get('AccountKey')
        
        # Ensure container exists
        self._ensure_container_exists()
    
    def _ensure_container_exists(self):
        """Ensure the blob container exists."""
        try:
            container_client = self.blob_service_client.get_container_client(self.container_name)
            container_client.get_container_properties()
        except Exception:
            # Container doesn't exist, create it without public access
            try:
                self.blob_service_client.create_container(
                    name=self.container_name
                    # No public_access parameter - container will be private
                )
                logger.info(f"Created container: {self.container_name}")
            except Exception as e:
                logger.error(f"Failed to create container: {e}")
                raise
    
    def upload_image_from_url(self, image_url: str, file_name: Optional[str] = None) -> str:
        """
        Download image from URL and upload to blob storage with optimized settings.
        
        Args:
            image_url: URL of the image to download and upload
            file_name: Optional custom filename. If not provided, generates UUID
            
        Returns:
            Public URL of the uploaded blob
        """
        try:
            # Generate filename if not provided
            if not file_name:
                file_name = f"{uuid.uuid4()}.png"
            elif not file_name.endswith(('.png', '.jpg', '.jpeg')):
                file_name += '.png'
            
            # Download image from URL with timeout
            logger.info(f"Downloading image from: {image_url}")
            response = requests.get(
                image_url, 
                timeout=DOWNLOAD_TIMEOUT,
                stream=True  # Stream for memory efficiency
            )
            response.raise_for_status()
            
            # Read content into memory
            image_data = response.content
            logger.info(f"Downloaded image size: {len(image_data)} bytes")
            
            # Upload to blob storage with timeout
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=file_name
            )
            
            # Set content type for images
            content_settings = ContentSettings(content_type='image/png')
            
            # Upload with explicit timeout and max concurrency for speed
            blob_client.upload_blob(
                data=BytesIO(image_data),
                content_settings=content_settings,
                overwrite=True,
                max_concurrency=4,  # Parallel upload threads
                timeout=UPLOAD_TIMEOUT
            )
            
            # Generate SAS URL for private container access (valid for 10 years)
            sas_token = generate_blob_sas(
                account_name=self.account_name,
                container_name=self.container_name,
                blob_name=file_name,
                account_key=self.account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.utcnow() + timedelta(days=3650)  # 10 years
            )
            
            blob_url_with_sas = f"{blob_client.url}?{sas_token}"
            logger.info(f"Successfully uploaded image to: {blob_url_with_sas}")
            return blob_url_with_sas
            
        except requests.Timeout:
            logger.error(f"Timeout downloading image from {image_url}")
            raise Exception("Image download timed out")
        except requests.RequestException as e:
            logger.error(f"Failed to download image from {image_url}: {e}")
            raise Exception(f"Failed to download image: {str(e)}")
        except Exception as e:
            logger.error(f"Failed to upload image to blob storage: {e}")
            raise Exception(f"Failed to upload image: {str(e)}")
    
    def upload_image_data(self, image_data: bytes, file_name: Optional[str] = None) -> str:
        """
        Upload image data directly to blob storage.
        
        Args:
            image_data: Raw image bytes
            file_name: Optional custom filename. If not provided, generates UUID
            
        Returns:
            Public URL of the uploaded blob
        """
        try:
            # Generate filename if not provided
            if not file_name:
                file_name = f"{uuid.uuid4()}.png"
            elif not file_name.endswith(('.png', '.jpg', '.jpeg')):
                file_name += '.png'
            
            # Upload to blob storage
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=file_name
            )
            
            # Set content type for images
            content_settings = ContentSettings(content_type='image/png')
            
            blob_client.upload_blob(
                data=BytesIO(image_data),
                content_settings=content_settings,
                overwrite=True
            )
            
            # Return public URL
            blob_url = blob_client.url
            logger.info(f"Successfully uploaded image to: {blob_url}")
            return blob_url
            
        except Exception as e:
            logger.error(f"Failed to upload image data to blob storage: {e}")
            raise Exception(f"Failed to upload image: {str(e)}")
    
    def delete_image(self, blob_url: str) -> bool:
        """
        Delete an image from blob storage.
        
        Args:
            blob_url: Full URL of the blob to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            # Extract blob name from URL
            blob_name = blob_url.split('/')[-1]
            
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            
            blob_client.delete_blob()
            logger.info(f"Successfully deleted blob: {blob_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete blob {blob_url}: {e}")
            return False
    
    def list_images(self, prefix: Optional[str] = None) -> list:
        """
        List all images in the container.
        
        Args:
            prefix: Optional prefix to filter blobs
            
        Returns:
            List of blob URLs
        """
        try:
            container_client = self.blob_service_client.get_container_client(self.container_name)
            blobs = container_client.list_blobs(name_starts_with=prefix)
            
            blob_urls = []
            for blob in blobs:
                blob_client = self.blob_service_client.get_blob_client(
                    container=self.container_name,
                    blob=blob.name
                )
                blob_urls.append(blob_client.url)
            
            return blob_urls
            
        except Exception as e:
            logger.error(f"Failed to list blobs: {e}")
            return []

# Global instance - lazy initialization
_blob_storage = None

def get_blob_storage() -> BlobStorageService:
    """Get blob storage instance with lazy initialization"""
    global _blob_storage
    if _blob_storage is None:
        _blob_storage = BlobStorageService()
    return _blob_storage
