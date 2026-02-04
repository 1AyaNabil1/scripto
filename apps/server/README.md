# 🤖 Scripto Backend

This directory contains the backend for **Scripto**, an Azure Function responsible for generating storyboards with text descriptions and AI-generated images.

## 🚀 Overview

- **Purpose**: To automate storyboard creation by integrating with GPT and DALL-E models hosted on Azure Cognitive Services.
- **Technology Stack**: Node.js, Azure Functions, Axios
- **API Endpoint**: `/api/generateStoryboard` (POST)

## ✨ Features

- Generates a specified number of storyboard frames from a user prompt.
- Supports customizable genres, visual styles, moods, and camera angles.
- Integrates with Azure OpenAI for text and image generation.
- Returns a structured JSON response with frame descriptions, dialogue, action notes, and image URLs.
- Includes robust error handling to ensure valid JSON output.

## 📂 Project Structure

```
ai-storyboard-backend/
├── src/
│   ├── functions/
│   │   └── generateStoryboard.js    # Main function handler
│   └── utils/
│       ├── buildGptPrompt.js        # Builds the GPT prompt
│       ├── buildImagePrompt.js      # Builds the DALL-E prompt
│       ├── callDalleModel.js        # Handles DALL-E API calls
│       └── callGptModel.js          # Handles GPT API calls
├── .funcignore                      # Files to ignore during deployment
├── host.json                        # Azure Functions configuration
├── local.settings.json              # Local environment variables
├── package.json                     # Project dependencies
└── README.md                        # This file
```

## ⚙️ Setup and Configuration

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Azure Functions Core Tools](https://github.com/Azure/azure-functions-core-tools)
- An Azure account with access to an OpenAI service.

### Installation

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `local.settings.json` file in this directory with your Azure OpenAI credentials.

    ```json
    {
      "IsEncrypted": false,
      "Values": {
        "AzureWebJobsStorage": "",
        "FUNCTIONS_WORKER_RUNTIME": "python",
        "LLM_MODEL_ENDPOINT": "YOUR_GPT_MODEL_ENDPOINT",
        "LLM_MODEL_API_KEY": "YOUR_GPT_MODEL_API_KEY",
        "DALLE_MODEL_ENDPOINT": "YOUR_DALLE_MODEL_ENDPOINT",
        "DALLE_MODEL_API_KEY": "YOUR_DALLE_MODEL_API_KEY"
      }
    }
    ```

## ▶️ Running Locally

To run the backend server locally, execute the following command:

```bash
func start
```

The API will be available at `http://localhost:7071/api/generateStoryboard`.

## ☁️ Deployment

The backend can be deployed to Azure Functions using the [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local) or the [Azure Functions extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions).

After deployment, remember to configure the application settings in the Azure portal with the same environment variables as in `local.settings.json`.

## 🤝 Contributing

Contributions are welcome! Please refer to the main [Contributing Guidelines](../../CONTRIBUTING.md) for more information.

## 📄 License

This project is licensed under the MIT License. See the main [LICENSE.txt](../../LICENSE.txt) file for details.
