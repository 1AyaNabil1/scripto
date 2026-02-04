# Scripto - AI Storyboard Weaver

A clean, modular edge-first monorepo for AI-powered storyboard generation.

## 📁 Project Structure

```
scripto/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── pages/          # Page components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── contexts/       # React context providers
│   │   │   ├── lib/            # Client utilities (API, auth)
│   │   │   └── types/          # Local types (can import from @scripto/types)
│   │   └── package.json
│   │
│   └── server/                 # Azure Functions (Python)
│       ├── src/
│       │   ├── api/            # API route handlers
│       │   ├── core/           # Core business logic
│       │   │   ├── auth/       # Auth provider abstraction
│       │   │   ├── ai/         # AI services
│       │   │   └── storage/    # Storage services
│       │   ├── repositories/   # Data access layer
│       │   ├── models/         # Data models
│       │   ├── config/         # Configuration
│       │   └── utils/          # Utilities
│       ├── db/                 # Database schema & migrations
│       └── requirements.txt
│
├── packages/
│   └── types/                  # Shared TypeScript types
│       └── src/
│           └── index.ts        # API contracts & domain models
│
├── package.json                # Root workspace config
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Python >= 3.9
- Azure Functions Core Tools
- MySQL database

### Installation

```bash
# Install all dependencies
npm install

# Set up Python virtual environment for server
cd apps/server
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

1. **Frontend** (`apps/web/.env`):
```env
VITE_API_BASE_URL=http://localhost:7071/api
```

2. **Backend** (`apps/server/local.settings.json`):
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "your-storage-connection-string",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "MYSQL_HOST": "localhost",
    "MYSQL_USER": "root",
    "MYSQL_PASSWORD": "your-password",
    "MYSQL_DATABASE": "scripto",
    "JWT_SECRET": "your-secret-key",
    "DEEPSEEK_API_KEY": "your-deepseek-key",
    "GITHUB_TOKEN": "your-github-token"
  }
}
```

### Running the Project

```bash
# Run both frontend and backend
npm run dev

# Or run separately:
npm run dev:web      # Frontend only
npm run dev:server   # Backend only
```

## 🏗️ Architecture Highlights

### Modular Auth System

The auth system is abstracted for easy provider switching:

```python
# apps/server/src/core/auth/base.py
class AuthProvider(ABC):
    @abstractmethod
    async def register(...): pass
    @abstractmethod
    async def login(...): pass
    # ... more methods

# Switch providers by changing Config.AUTH_PROVIDER
# Currently: 'custom' (JWT)
# Future: 'supabase', 'auth0', etc.
```

### Clean Separation of Concerns

- **API Layer** (`apps/server/src/api/`): HTTP handlers
- **Core Layer** (`apps/server/src/core/`): Business logic
- **Repository Layer** (`apps/server/src/repositories/`): Data access
- **Models** (`apps/server/src/models/`): Data structures

### Workspace Benefits

- Shared types between frontend & backend
- Unified dependency management
- Easy to add new apps/packages
- Clear module boundaries

## 🔧 Development

### Adding a New Auth Provider

1. Create provider in `apps/server/src/core/auth/providers/`:
```python
from .base import AuthProvider

class SupabaseAuthProvider(AuthProvider):
    async def register(...):
        # Implementation
```

2. Update factory in `apps/server/src/core/auth/__init__.py`:
```python
if provider_type == 'supabase':
    cls._instance = SupabaseAuthProvider()
```

3. Change config: `Config.AUTH_PROVIDER = 'supabase'`

### Adding Shared Types

Add types to `packages/types/src/index.ts`:
```typescript
export interface MyNewType {
  // ...
}
```

Import in apps:
```typescript
import type { MyNewType } from '@scripto/types';
```

## 📦 Build & Deploy

```bash
# Build frontend for production
npm run build

# Deploy backend (Azure Functions)
cd apps/server
func azure functionapp publish <your-function-app-name>
```

## 🧪 Testing

```bash
# Run linter
npm run lint

# Add tests (TODO)
npm test
```

## 📄 License

[Your License]
