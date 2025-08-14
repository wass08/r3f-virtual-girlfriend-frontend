# 🔐 GitHub Repository Secrets Setup Guide

**⚠️ SECURITY NOTICE: Never commit secrets to your repository!**

All sensitive configuration is handled through GitHub Repository Secrets, which are encrypted and secure.

## 📋 Required Repository Secrets

Go to your GitHub repository:
**https://github.com/chitimalli/virtual-girlfriend/settings/secrets/actions**

Click **"New repository secret"** and add each of the following:

### 1. **VITE_AGORA_APP_ID**
- **Name**: `VITE_AGORA_APP_ID`
- **Value**: Your Agora Application ID (from Agora Console)
- **Example**: `abc123def456ghi789`

### 2. **VITE_AGORA_TOKEN** 
- **Name**: `VITE_AGORA_TOKEN`
- **Value**: Your Agora temporary token or token server URL
- **Example**: `007abc123...` (temporary token) or `https://your-token-server.com/token`

### 3. **VITE_CONVOAI_API_URL**
- **Name**: `VITE_CONVOAI_API_URL`  
- **Value**: ConvoAI API endpoint
- **Example**: `https://api.convoai.tech`

### 4. **VITE_RESTFUL_USERNAME**
- **Name**: `VITE_RESTFUL_USERNAME`
- **Value**: Your ConvoAI username
- **Example**: `your_username`

### 5. **VITE_RESTFUL_PASSWORD**
- **Name**: `VITE_RESTFUL_PASSWORD`
- **Value**: Your ConvoAI password
- **Example**: `your_secure_password`

## 🔧 Setup Steps

1. **Navigate to Repository Secrets**:
   ```
   GitHub Repo → Settings → Secrets and variables → Actions → New repository secret
   ```

2. **Add Each Secret**:
   - Enter the exact secret name (case-sensitive)
   - Paste the secret value
   - Click "Add secret"

3. **Verify Setup**:
   - You should see 5 secrets listed
   - Secret values are hidden (showing only `***`)

## 🚀 Deployment Trigger

Once all secrets are added:

1. **Automatic**: Push any changes to `agora_convoai_dev` branch
2. **Manual**: Go to Actions tab → "Deploy to GitHub Pages" → "Run workflow"

## 🌐 Your App URL

After successful deployment:
**https://chitimalli.github.io/virtual-girlfriend/**

## 🔍 Troubleshooting

**Build fails?**
- Check Actions tab for error messages
- Verify all 5 secrets are correctly named and set
- Ensure secret values don't contain trailing spaces

**App doesn't load?**
- Check browser console for errors
- Verify Agora console allows your GitHub Pages domain
- Check that API endpoints are accessible from browser

## 🛡️ Security Benefits

✅ **Secrets are encrypted** in GitHub  
✅ **Never exposed** in repository code  
✅ **Only available** during GitHub Actions builds  
✅ **Can be rotated** without code changes  
✅ **Team members** can't see secret values  

---

**Remember**: Never put secrets in `.env` files that get committed to the repository!
