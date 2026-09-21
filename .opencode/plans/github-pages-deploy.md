# Plan: Fix GitHub Pages Blank Screen Deployment

## Problem
GitHub Pages deployment shows blank screen due to incorrect asset paths when served from subfolder `/Justify/`.

## Root Cause
Missing `base` configuration in Vite config and missing GitHub Actions workflow for automated deployment.

## Changes Required

### 1. Update `vite.config.js`
- Add `base: '/Justify/'` to Vite config
- Update PWA manifest `scope` and `start_url` to `/Justify/`

### 2. Create `.github/workflows/deploy.yml`
- GitHub Actions workflow for automated build & deploy to GitHub Pages
- Trigger on push to main branch
- Use `actions/deploy-pages@v4`

### 3. Verification
- Run `npm run build` locally to verify no errors
- Commit and push to main branch

## Files to Modify
- `vite.config.js` (update)
- `.github/workflows/deploy.yml` (new)

## Commands
```powershell
# Update vite.config.js
# Create .github/workflows/deploy.yml
npm run build
git add vite.config.js .github/workflows/deploy.yml
git commit -m "fix: add base path for GitHub Pages deployment"
git push origin main
```