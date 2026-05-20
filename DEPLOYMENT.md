# 🚀 ArchitectAI Deployment Guide - FASTEST PATH

Your code is ready to deploy! Follow these steps for the fastest cloud deployment:

## ✅ What's Done
- ✅ Project cloned and dependencies installed
- ✅ Development server running locally on http://localhost:3000
- ✅ Code pushed to GitHub (harryson22102004/architect-ai-)
- ✅ `.env` file configured with Gemini API key

## 📋 Deployment Steps (5-10 minutes total)

### Step 1: Set Up MongoDB Atlas (Free Cloud Database)
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Sign Up" (use email or GitHub)
3. Create a free cluster (M0 tier - always free)
4. Go to Database → Connect
5. Copy your connection string that looks like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/architectai?retryWrites=true&w=majority
   ```

### Step 2: Deploy to Vercel (1-Click)
1. Go to https://vercel.com/new
2. **Sign in with GitHub** (fastest)
3. Search for "architect-ai-" repository
4. Click "Import"
5. Under "Environment Variables", add:
   ```
   MONGO_URL = mongodb+srv://... (from Step 1)
   DB_NAME = architectai
   GEMINI_API_KEY = AIzaSyCzB_N0-w5m6kgDi8QzvBkDv7M7Td3VxHU
   CORS_ORIGINS = *
   ```
6. Click **"Deploy"**
7. Wait ~2-3 minutes
8. Your app will be live at a URL like: `https://architect-ai-[random].vercel.app`

## 🔑 Environment Variables Needed on Vercel
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/architectai?retryWrites=true&w=majority
DB_NAME=architectai
GEMINI_API_KEY=AIzaSyCzB_N0-w5m6kgDi8QzvBkDv7M7Td3VxHU
CORS_ORIGINS=*
NEXT_PUBLIC_BASE_URL=https://your-vercel-url.vercel.app
```

## 🔐 Security Note
⚠️ **IMPORTANT: Your Gemini API key is exposed in chat history**
- Regenerate it at https://aistudio.google.com/apikey
- The exposed key should be disabled/deleted immediately
- Use Vercel's secrets manager for production keys

## 📝 Local Testing
App is currently running at: http://localhost:3000
Test it before deploying:
1. Type a prompt like "A clone of Airbnb with hosts, listings, bookings, payments, and reviews"
2. Click "Generate Architecture"
3. Should see Prisma schema + ER diagram

## ⚡ Alternative: Deploy to Railway (Even Faster with MongoDB Included)
If you prefer an all-in-one solution:
1. Go to https://railway.app
2. Click "New Project"
3. Choose "Deploy from GitHub"
4. Select architect-ai- repo
5. Railway auto-provisions MongoDB + Node.js
6. Set environment variables (same as above)
7. Done! Takes ~3 minutes total

## 🆘 Troubleshooting
- If MongoDB connection fails: Check connection string has correct username/password
- If API calls fail: Verify GEMINI_API_KEY is set correctly in Vercel
- If site is blank: Check browser console for errors (F12)
- Clear browser cache if UI looks broken

## Next Steps
1. Sign up for MongoDB Atlas → Get connection string
2. Go to Vercel → Import this GitHub repo
3. Add environment variables
4. Deploy!

Your live app will be ready in under 10 minutes. 🎉
