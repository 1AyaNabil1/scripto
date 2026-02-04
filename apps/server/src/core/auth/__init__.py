"""
Authentication provider factory.
Provides a single interface to get the configured auth provider.
Switch providers by changing Config.AUTH_PROVIDER.
"""
from .base import AuthProvider
from .providers import CustomAuthProvider
from src.config.settings import Config


class AuthProviderFactory:
    """Factory for creating authentication provider instances."""
    
    _instance: AuthProvider = None
    
    @classmethod
    def get_provider(cls) -> AuthProvider:
        """Get the configured authentication provider instance."""
        if cls._instance is None:
            provider_type = getattr(Config, 'AUTH_PROVIDER', 'custom')
            
            if provider_type == 'custom':
                cls._instance = CustomAuthProvider()
            # Add more providers here as needed:
            # elif provider_type == 'supabase':
            #     cls._instance = SupabaseAuthProvider()
            # elif provider_type == 'auth0':
            #     cls._instance = Auth0Provider()
            else:
                raise ValueError(f"Unknown auth provider: {provider_type}")
        
        return cls._instance


# Convenience function for getting the auth provider
def get_auth_provider() -> AuthProvider:
    """Get the current authentication provider."""
    return AuthProviderFactory.get_provider()


__all__ = ['AuthProvider', 'get_auth_provider', 'AuthProviderFactory']
