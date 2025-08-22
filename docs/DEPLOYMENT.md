# Virtual Agent - Deployment Guide

## GitHub Pages Deployment

### Current Setup
The project is configured for GitHub Pages deployment with the following setup:

```bash
npm run deploy
```

This command:
1. Builds the project using Vite
2. Deploys the `dist` folder to the `gh-pages` branch
3. Makes it available at: `https://chitimalli.github.io/virtual-agent/`

### Extended Architecture Deployment

For the extended agentic framework, you'll need additional services:

#### 1. Frontend (GitHub Pages)
- **Repository**: `virtual-agent`
- **Branch**: `gh-pages` (auto-generated)
- **URL**: `https://chitimalli.github.io/virtual-agent/`

#### 2. Backend Services Options

##### Option A: Firebase (Recommended)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init

# Deploy functions (if using)
firebase deploy --only functions

# Database: Firestore (NoSQL)
# Auth: Firebase Authentication
# Storage: Firebase Storage
# Hosting: Can also host on Firebase if needed
```

##### Option B: Supabase
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Database: PostgreSQL
# Auth: Supabase Auth
# Storage: Supabase Storage
# Edge Functions: For serverless backend
```

##### Option C: Vercel/Netlify Functions
```bash
# For Vercel
npm install -g vercel
vercel --prod

# For Netlify
npm install -g netlify-cli
netlify deploy --prod
```

### Environment Variables Setup

#### For Development (.env.local)
```bash
# Agora Configuration
VITE_AGORA_APP_ID=your_agora_app_id
VITE_AGORA_TOKEN=your_agora_token
VITE_AGORA_CHANNEL=VirtualAgent_Channel

# Firebase Configuration (if using Firebase)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# ConvoAI Configuration
VITE_CONVOAI_AGENT_NAME=Virtual Agent
VITE_CONVOAI_AGENT_UID=8888
VITE_RESTFUL_API_KEY=your_restful_api_key
VITE_RESTFUL_PASSWORD=your_restful_password

# LLM Configuration
VITE_LLM_API_KEY=your_llm_api_key
VITE_LLM_MODEL=gpt-4o-mini
VITE_LLM_SYSTEM_MESSAGE=You are a friendly virtual agent assistant.

# TTS Configuration
VITE_TTS_API_KEY=your_tts_api_key
VITE_TTS_REGION=eastus
VITE_TTS_VOICE_NAME=en-US-AriaNeural
```

#### For Production (GitHub Secrets)
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the same environment variables as secrets
4. Update `.github/workflows/deploy.yml` to use these secrets

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build
      env:
        VITE_AGORA_APP_ID: ${{ secrets.VITE_AGORA_APP_ID }}
        VITE_AGORA_TOKEN: ${{ secrets.VITE_AGORA_TOKEN }}
        VITE_AGORA_CHANNEL: ${{ secrets.VITE_AGORA_CHANNEL }}
        VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
        VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
        VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
        VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
        VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
        VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
        # Add other environment variables as needed

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### Performance Optimization for Extended Features

#### 1. Code Splitting
```javascript
// Lazy load heavy components
const SceneSelector = lazy(() => import('./pages/SceneSelector'));
const Friends = lazy(() => import('./pages/Friends'));
const Store = lazy(() => import('./pages/Store'));
```

#### 2. Asset Optimization
```javascript
// Use dynamic imports for scenes
const loadScene = async (sceneName) => {
  const scene = await import(`./scenes/${sceneName}`);
  return scene.default;
};
```

#### 3. Caching Strategy
```javascript
// Service worker for caching
// Progressive Web App capabilities
// Local storage for user preferences
```

### Security Considerations

#### 1. API Key Management
- Never commit API keys to the repository
- Use environment variables for all sensitive data
- Implement API key rotation strategy

#### 2. Authentication
- Use secure authentication providers (Firebase Auth, Auth0)
- Implement proper session management
- Add rate limiting for API calls

#### 3. Content Security
- Implement Content Security Policy (CSP)
- Sanitize user-generated content
- Use HTTPS for all communications

### Monitoring and Analytics

#### 1. Error Tracking
```bash
# Add Sentry for error tracking
npm install @sentry/react @sentry/tracing
```

#### 2. Analytics
```bash
# Add Google Analytics or Firebase Analytics
npm install gtag
```

#### 3. Performance Monitoring
- Use Lighthouse CI for performance monitoring
- Implement Core Web Vitals tracking
- Monitor bundle size and loading times

### Backup and Recovery

#### 1. Data Backup
- Regular database backups
- Version control for all code
- Asset backup to cloud storage

#### 2. Disaster Recovery
- Multiple deployment environments
- Rollback procedures
- Health checks and monitoring
```
