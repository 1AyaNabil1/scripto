# 🎨 Vloomeo

<p align="center">
  <img src="https://placehold.co/600x300/000000/FFFFFF/png?text=Vloomeo" alt="Vloomeo Banner">
</p>

<p align="center">
  <strong>Transform your stories into stunning visual storyboards with the power of AI.</strong>
</p>

<p align="center">
  <a href="https://github.com/kershrita/vloomeo/blob/main/LICENSE.txt">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
  </a>
  <a href="https://github.com/kershrita/vloomeo/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/kershrita/vloomeo/main.yml?branch=main" alt="CI/CD Status">
  </a>
  <a href="https://github.com/kershrita/vloomeo/issues">
    <img src="https://img.shields.io/github/issues/kershrita/vloomeo" alt="Issues">
  </a>
</p>

**Vloomeo** is a full-stack application designed to transform written stories into visual storyboards. It leverages generative AI to create scene descriptions, dialogue, and corresponding images, providing a seamless experience for writers, filmmakers, and creators.

## ✨ Features

- **🤖 AI-Powered Storyboard Generation**: Automatically creates detailed storyboards from a simple story plot.
- **🎭 Rich Scene Detail**: Generates scene descriptions, dialogue, and action notes.
- **🎨 Visual Style Customization**: Allows users to define the genre, mood, and visual style (e.g., Cinematic, Anime, Noir).
- **🖼️ Image Generation**: Utilizes a DALL-E model to generate a unique image for each scene in the storyboard.
- **🌐 Web-Based Interface**: An intuitive and responsive user interface for submitting stories and viewing the final storyboard.
- **🚀 Serverless Architecture**: Built with a scalable and efficient serverless backend using Azure Functions.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Azure Functions
- **AI Models**:
  - A GPT-based model for text and storyboard generation.
  - A DALL-E-based model for image generation.

## 📂 Project Structure

The application is structured as a monorepo with two main components:

```
/
├── frontend/      # React/TypeScript UI
└── backend/       # Node.js Azure Functions API
```

For detailed information about each component, please refer to their respective README files:

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## 🚀 Getting Started

To get started with Vloomeo, you'll need to set up both the frontend and backend services.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Azure Functions Core Tools](https://github.com/Azure/azure-functions-core-tools)
- An Azure account with access to an OpenAI service with GPT and DALL-E models deployed.

### Setup Instructions

1.  **Backend Setup**: Follow the instructions in the [Backend README](./backend/README.md) to set up and run the backend service.
2.  **Frontend Setup**: Follow the instructions in the [Frontend README](./frontend/README.md) to set up and run the frontend application.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.txt](./LICENSE.txt) file for details.

---

© 2025 Ashraf.Zone. All rights reserved.
