# DeckPro Deployment Guide

## Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All critical lint errors fixed
- [ ] No console errors in development
- [ ] All unused imports removed
- [ ] Test files removed from production

### ✅ Build & Performance
- [ ] Production build succeeds (`npm run build`)
- [ ] Bundle size under 400KB (currently ~364KB)
- [ ] Assets properly cached with immutable headers
- [ ] Error boundaries in place

### ✅ Core Features Validation
- [ ] Canvas drawing functionality works
- [ ] Deck footprint can be created/edited
- [ ] Joist and beam generation works
- [ ] Material calculations are accurate
- [ ] Export functionality works
- [ ] Price calculations display correctly

### 📋 Environment Setup
- [ ] Environment variables configured
- [ ] API endpoints updated (if applicable)
- [ ] Analytics disabled for initial launch

## Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Option 2: Netlify
```bash
# Drag and drop the 'dist' folder to Netlify
# Or use CLI:
npm i -g netlify-cli
netlify deploy
netlify deploy --prod
```

### Option 3: Static Hosting (AWS S3, GitHub Pages)
```bash
# Build the project
npm run build

# Upload contents of 'dist' folder to your hosting service
```

## Post-Deployment

### Monitoring
1. Check browser console for errors
2. Test all core features
3. Verify responsive design on mobile
4. Check performance metrics

### Known Issues to Watch
- Canvas performance on older devices
- Touch controls on mobile devices
- Memory usage with large deck designs

## Rollback Plan
1. Keep previous build artifacts
2. Use hosting provider's rollback feature
3. Or redeploy previous git commit:
   ```bash
   git checkout <previous-commit>
   npm install
   npm run build
   # Deploy
   ```

## Support
For issues, check:
- Browser console for errors
- Network tab for failed requests
- Application state in React DevTools