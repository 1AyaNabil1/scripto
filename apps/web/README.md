# 🎨 Scripto - Frontend

This directory contains the frontend for **Scripto**, a modern, responsive web interface built with React, TypeScript, and Vite.

## ✨ Features

- **🖼️ Intuitive Story Input**: A clean interface for users to enter their story and generation preferences.
- **🎬 Dynamic Storyboard Display**: Renders the generated storyboard in a clear and visually appealing format.
- **갤러리 Gallery Page**: Browse and view previously created storyboards with search and filter functionality.
- **ℹ️ About Page**: Learn about the project, its technology stack, and development philosophy.
- **🎨 Visual Style Options**: Customize the genre, mood, and visual style of the storyboard.
- **📱 Responsive Design**: Ensures a seamless experience across all devices.
- **🔄 Loading and Error States**: Provides clear feedback to the user during API calls.
- **📥 Export Functionality**: Download storyboards as PDF files.

## 🛠️ Tech Stack

- **Framework**: React 18, TypeScript
- **Routing**: React Router
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📂 Project Structure

```
src/
├── assets/              # Static assets
├── components/          # React components
│   ├── common/          # General-purpose components
│   ├── features/        # Feature-specific components
│   └── layout/          # Layout components (Header, Footer)
├── hooks/               # Custom React hooks
├── types/               # TypeScript definitions
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- A running instance of the [backend service](../backend).

### Installation

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in this directory and specify the URL of the backend API.

    ```env
    # API Configuration
    VITE_API_BASE_URL=https://Scripto.azurewebsites.net

    # Environment
    VITE_NODE_ENV=development

    # App Configuration
    VITE_APP_NAME=AI Storyboard Weaver
    VITE_APP_VERSION=1.0.0
    ```

    **Environment-specific configurations:**
    - Development: `VITE_API_BASE_URL=http://localhost:7071`
    - Production: `VITE_API_BASE_URL=https://Scripto.azurewebsites.net`
    - Staging: `VITE_API_BASE_URL=https://staging-Scripto.azurewebsites.net`

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application will be accessible at `http://localhost:5173`.

## 📜 Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Bundles the application for production.
- `npm run lint`: Lints the codebase.
- `npm run preview`: Serves the production build locally.

## 🔧 Configuration & Setup

### CORS Configuration

If you encounter CORS errors when connecting to the backend API, ensure the Azure Function is properly configured:

#### Azure Portal Configuration:
1. Navigate to your Function App in [Azure Portal](https://portal.azure.com/)
2. Go to **"API"** → **"CORS"**
3. Add these allowed origins:
   ```
   https://Scripto.ashraf.zone
   http://localhost:5173
   http://localhost:3000
   ```

#### Backend host.json Configuration:
```json
{
  "version": "2.0",
  "functionTimeout": "00:10:00",
  "extensions": {
    "http": {
      "cors": {
        "allowedOrigins": [
          "https://Scripto.ashraf.zone",
          "http://localhost:5173",
          "http://localhost:3000"
        ],
        "allowedMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allowedHeaders": ["Content-Type", "Authorization", "Accept"],
        "allowCredentials": false,
        "maxAge": 300
      }
    }
  }
}
```

#### Testing CORS Setup:
```bash
curl -X OPTIONS \
  -H "Origin: https://Scripto.ashraf.zone" \
  -H "Access-Control-Request-Method: POST" \
  -v https://Scripto.azurewebsites.net/api/generateStoryboard
```

### SEO Optimization

The application includes comprehensive SEO optimization:

#### ✅ Implemented Features:
- **Meta Tags**: Dynamic meta tags using `react-helmet-async`
- **Open Graph**: Social media sharing optimization
- **Structured Data**: JSON-LD schema markup for search engines
- **Sitemap**: Auto-generated sitemap.xml
- **Performance**: Code splitting and optimized bundles
- **Mobile**: Responsive design with PWA capabilities

#### Key SEO Files:
- `public/sitemap.xml` - Site structure for search engines
- `public/robots.txt` - Search engine crawling instructions
- `public/manifest.json` - PWA manifest
- `src/components/common/SEO.tsx` - Dynamic SEO component
- `src/components/common/StructuredData.tsx` - JSON-LD component

#### SEO Performance Features:
```javascript
// Vite build optimization
manualChunks: {
  vendor: ['react', 'react-dom'],
  router: ['react-router-dom'],
  animation: ['framer-motion'],
  icons: ['lucide-react'],
  seo: ['react-helmet-async']
}
```

#### Production SEO Checklist:
- [ ] Update meta tags with production domain
- [ ] Submit sitemap to Google Search Console
- [ ] Test social sharing on all platforms
- [ ] Verify structured data with Google's Rich Results Test
- [ ] Set up Google Analytics tracking

## 🚀 Deployment

### Build for Production:
```bash
npm run build
```

### Preview Production Build:
```bash
npm run preview
```

The build artifacts will be stored in the `dist/` directory, optimized for production with:
- Code splitting for efficient loading
- Minified and compressed assets
- SEO-optimized HTML structure
- PWA capabilities

## 🤝 Contributing

Contributions are welcome! Please refer to the main [Contributing Guidelines](../../CONTRIBUTING.md) for more information.

## 📄 License

This project is licensed under the MIT License. See the main [LICENSE.txt](../../LICENSE.txt) file for details.
