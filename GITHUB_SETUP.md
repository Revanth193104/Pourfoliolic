# GitHub Setup Instructions

Follow these steps to set up automatic syncing from Replit to GitHub:

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `pourfoliolic`
3. Description: "Your personal drink tasting journal"
4. Make it **Public** (so users can install it)
5. Click **Create repository**

## Step 2: Add Repository to Replit

Once you've created the repo, run these commands in Replit terminal:

```bash
git remote add github https://github.com/Revanth193104/pourfoliolic.git
git branch -M main
git push -u github main
```

## Step 3: Automatic Syncing

The GitHub Actions workflow (`.github/workflows/sync-to-github.yml`) will:
- ✅ Check for updates every 6 hours
- ✅ Keep your GitHub repo in sync with Replit
- ✅ Can be manually triggered from GitHub Actions tab

## Benefits

- 📦 Code backup on GitHub
- 🔄 Automatic syncing every 6 hours
- 📊 Full version history preserved
- 🚀 Ready for CI/CD if you want to add it later
- 👥 Easy to share with team members

## Manual Trigger

To manually sync code to GitHub anytime:
1. Go to your GitHub repo
2. Click **Actions** tab
3. Click **Sync to GitHub** workflow
4. Click **Run workflow** button

Done! Your Pourfoliolic app is now on GitHub with automatic syncing. 🎉
