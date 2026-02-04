# How to Run Scripto

## Prerequisites

### Install Azure Functions Core Tools (Required for Backend)

**macOS** (using Homebrew):
```bash
brew tap azure/functions
brew install azure-functions-core-tools@4
```

**Verify installation**:
```bash
func --version
```

### Install Dependencies

**Frontend**:
```bash
cd apps/web
npm install
```

**Backend**:
```bash
cd apps/server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Running the Project

### Option 1: Run Both (Recommended)

```bash
# From project root
npm run dev:web      # Terminal 1: Frontend
npm run dev:server   # Terminal 2: Backend (requires func CLI)
```

### Option 2: Run Separately

**Frontend**:
```bash
cd apps/web
npm run dev
# Opens at http://localhost:5173/
```

**Backend**:
```bash
cd apps/server
source .venv/bin/activate
func start
# Runs at http://localhost:7071/api
```

### Option 3: Use VS Code Tasks

1. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Run Task"
3. Select "func: host start"

## Configuration

### Backend Environment Variables

Create `apps/server/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "MYSQL_HOST": "localhost",
    "MYSQL_USER": "root",
    "MYSQL_PASSWORD": "your-password",
    "MYSQL_DATABASE": "scripto",
    "JWT_SECRET": "your-secret-key-change-in-production",
    "DEEPSEEK_API_KEY": "your-deepseek-api-key",
    "GITHUB_TOKEN": "your-github-token"
  }
}
```

### Frontend Environment Variables

Create `apps/web/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:7071/api
```

## Troubleshooting

### "command not found: func"
Install Azure Functions Core Tools (see Prerequisites above)

### Port Already in Use
- Frontend (5173): Change in `apps/web/vite.config.ts`
- Backend (7071): Change in `apps/server/host.json`

### Python Virtual Environment Issues
```bash
cd apps/server
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Next Steps

1. Set up your MySQL database using `apps/server/db/database_schema.sql`
2. Configure your environment variables
3. Start developing! 🚀