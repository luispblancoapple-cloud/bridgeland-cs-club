# Bridgeland CS Club

## Deploy to GitHub Pages

### One-time setup

1. **Create a GitHub repo** — e.g. `bridgeland-cs-club`

2. **Update the base path** in `vite.config.ts`:
   ```ts
   base: '/YOUR-REPO-NAME/',
   ```

3. **Push this folder** to your repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git push -u origin main
   ```

4. **Enable GitHub Pages** in your repo:
   - Go to **Settings → Pages**
   - Under *Source*, select **GitHub Actions**

5. The site will automatically build and deploy every time you push to `main`.
   Your URL will be: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

## Local development

```bash
npm install
npm run dev
```
