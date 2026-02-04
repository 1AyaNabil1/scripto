"""
Azure Blob Storage service for handling image uploads and management.
"""

import os
import uuid
import requests
from io import BytesIO
from azure.storage.blob import BlobServiceClient, ContentSettings
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class BlobStorageService:
    def __init__(self):
        """Initialize Azure Blob Storage client."""
        connection_string = os.environ.get('AzureWebJobsStorage')
        if not connection_string:
            raise ValueError("AzureWebJobsStorage environment variable not set")
        
        self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        self.container_name = "storyboard-images"
        
        # Ensure container exists
        self._ensure_container_exists()
    
    def _ensure_container_exists(self):
        """Ensure the blob container exists."""
        try:
            container_client = self.blob_service_client.get_container_client(self.container_name)
            container_client.get_container_properties()
        except Exception:
            # Container doesn't exist, create it
            try:
                self.blob_service_client.create_container(
                    name=self.container_name,
                    public_access='blob'  # Allow public read access to blobs
                )
                logger.info(f"Created container: {self.container_name}")
            except Exception as e:
                logger.error(f"Failed to create container: {e}")
                raise
    
    def upload_image_from_url(self, image_url: str, file_name: Optional[str] = None) -> str:
        """
        Download image from URL and upload to blob storage.
        
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
            
            # Download image from URL
            logger.info(f"Downloading image from: {image_url}")
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            
            # Upload to blob storage
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=file_name
            )
            
            # Set content type for images
            content_settings = ContentSettings(content_type='image/png')
            
            blob_client.upload_blob(
                data=BytesIO(response.content),
                content_settings=content_settings,
                overwrite=True
            )
            
            # Return public URL
            blob_url = blob_client.url
            logger.info(f"Successfully uploaded image to: {blob_url}")
            return blob_url
            
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
