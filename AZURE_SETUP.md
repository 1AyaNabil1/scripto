# Azure Setup Guide for Scripto Backend

## Overview
This guide helps you set up Azure resources and configure your backend environment.

## Required Azure Resources

### 1. Azure Storage Account (for blob storage)
### 2. Azure AI Services (for DeepSeek/GPT models)
### 3. Azure Database for MySQL (or use local MySQL)

---

## Step 1: Create Azure Resource Group

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name scripto-rg \
  --location eastus

# Verify
az group show --name scripto-rg
```

---

## Step 2: Create Azure Storage Account

```bash
# Create storage account
az storage account create \
  --name scriptostorage \
  --resource-group scripto-rg \
  --location eastus \
  --sku Standard_LRS

# Get connection string
az storage account show-connection-string \
  --name scriptostorage \
  --resource-group scripto-rg \
  --query connectionString \
  --output tsv
```

**Copy the connection string** to `AzureWebJobsStorage` in `local.settings.json`

---

## Step 3: Set Up Azure AI Services

### Option A: Use Azure OpenAI (Recommended)

```bash
# Create Azure OpenAI resource
az cognitiveservices account create \
  --name scripto-openai \
  --resource-group scripto-rg \
  --kind OpenAI \
  --sku S0 \
  --location eastus

# Get endpoint and key
az cognitiveservices account show \
  --name scripto-openai \
  --resource-group scripto-rg \
  --query properties.endpoint \
  --output tsv

az cognitiveservices account keys list \
  --name scripto-openai \
  --resource-group scripto-rg \
  --query key1 \
  --output tsv
```

### Option B: Use GitHub Models (Free for development)

1. Go to https://github.com/marketplace/models
2. Get your GitHub token from https://github.com/settings/tokens
3. Use endpoint: `https://models.inference.ai.azure.com`

---

## Step 4: Set Up MySQL Database

### Option A: Azure Database for MySQL

```bash
# Create MySQL server
az mysql flexible-server create \
  --name scripto-mysql \
  --resource-group scripto-rg \
  --location eastus \
  --admin-user adminuser \
  --admin-password "YourPassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --public-access 0.0.0.0

# Get connection details
az mysql flexible-server show \
  --resource-group scripto-rg \
  --name scripto-mysql
```

### Option B: Local MySQL (for development)

```bash
# Install MySQL (macOS)
brew install mysql

# Start MySQL
brew services start mysql

# Create database
mysql -u root -p
CREATE DATABASE scripto;
EXIT;

# Import schema
mysql -u root -p scripto < apps/server/db/database_schema.sql
```

---

## Step 5: Configure local.settings.json

Copy `apps/server/local.settings.json.example` to `apps/server/local.settings.json` and fill in your values:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=https;AccountName=scriptostorage;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    
    "LLM_MODEL_ENDPOINT": "https://models.inference.ai.azure.com",
    "LLM_MODEL_API_KEY": "your-github-token-or-azure-key",
    
    "DALLE_MODEL_ENDPOINT": "https://your-openai-resource.openai.azure.com/",
    "DALLE_MODEL_API_KEY": "your-dalle-api-key",
    
    "DB_HOST": "scripto-mysql.mysql.database.azure.com",
    "DB_NAME": "scripto",
    "DB_USER": "adminuser",
    "DB_PASSWORD": "YourPassword123!",
    "DB_PORT": "3306",
    
    "JWT_SECRET": "change-this-to-a-random-64-character-string"
  },
  "Host": {
    "CORS": "*"
  }
}
```

---

## Step 6: Generate Secure JWT Secret

```bash
# Generate a secure random string
openssl rand -base64 48
```

Copy the output to `JWT_SECRET` in your `local.settings.json`

---

## Step 7: Test Configuration

```bash
cd apps/server
source .venv/bin/activate
func start

# In another terminal, test an endpoint
curl http://localhost:7071/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
```

---

## Quick Setup for Development (No Azure)

For local development without Azure resources:

1. **Use Local MySQL**:
   ```bash
   brew install mysql
   brew services start mysql
   mysql -u root -p < apps/server/db/database_schema.sql
   ```

2. **Use GitHub Models (Free)**:
   - Get token: https://github.com/settings/tokens
   - Endpoint: `https://models.inference.ai.azure.com`

3. **Mock Azure Storage** (optional):
   - Install Azurite: `npm install -g azurite`
   - Run: `azurite --silent --location /tmp/azurite --debug /tmp/azurite/debug.log`
   - Use connection string: `UseDevelopmentStorage=true`

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `AzureWebJobsStorage` | Azure Storage connection string | See Azure portal |
| `FUNCTIONS_WORKER_RUNTIME` | Always "python" | `python` |
| `LLM_MODEL_ENDPOINT` | AI model endpoint | `https://models.inference.ai.azure.com` |
| `LLM_MODEL_API_KEY` | AI model API key | GitHub token or Azure key |
| `DALLE_MODEL_ENDPOINT` | DALL-E endpoint | Azure OpenAI endpoint |
| `DALLE_MODEL_API_KEY` | DALL-E API key | Azure OpenAI key |
| `DB_HOST` | MySQL hostname | `localhost` or Azure MySQL host |
| `DB_NAME` | Database name | `scripto` |
| `DB_USER` | Database user | `root` or Azure admin user |
| `DB_PASSWORD` | Database password | Your password |
| `DB_PORT` | MySQL port | `3306` |
| `JWT_SECRET` | Secret for JWT tokens | Random 64-char string |

---

## Troubleshooting

### "Configuration validation failed"
- Ensure all required variables are set in `local.settings.json`
- Check that no values are empty or placeholder

### Database connection issues
- Verify MySQL is running: `brew services list`
- Test connection: `mysql -h localhost -u root -p scripto`
- Check firewall rules for Azure MySQL

### Azure Storage issues
- Verify connection string is correct
- For local dev, use Azurite or set to empty string temporarily

---

## Next Steps

1. ✅ Configure `local.settings.json` with your values
2. ✅ Set up database and import schema
3. ✅ Test backend endpoints
4. Configure frontend `.env.local` (already has correct API URL)
5. Start developing!

## Useful Commands

```bash
# View Azure resources
az resource list --resource-group scripto-rg --output table

# Delete all resources (cleanup)
az group delete --name scripto-rg --yes

# View function logs
func start --verbose

# Deploy to Azure
cd apps/server
func azure functionapp publish scripto-function-app
```
