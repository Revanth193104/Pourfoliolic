#!/usr/bin/env node

import { execSync } from 'child_process';

const username = 'Revanth193104';
const repoName = 'pourfoliolic';

console.log(`
╔════════════════════════════════════════════════════════════╗
║     Pourfoliolic → GitHub Sync Setup                       ║
╚════════════════════════════════════════════════════════════╝

This script will sync your Pourfoliolic code to GitHub.

📋 Prerequisites:
   ✓ GitHub account: ${username}
   ✓ GitHub repo created: ${repoName}
   
If you haven't created the repo yet, go to:
https://github.com/new and create it with:
  - Name: ${repoName}
  - Description: Your personal drink tasting journal
  - Public (recommended for PWA installation)

Press Enter to continue...
`);

// Get GitHub token from environment
async function getGitHubToken(): Promise<string> {
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : null;

    if (!hostname || !xReplitToken) {
      throw new Error('Replit environment not detected');
    }

    const res = await fetch(
      `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=github`,
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );

    const data = await res.json();
    const token = data.items?.[0]?.settings?.access_token;

    if (!token) {
      throw new Error('GitHub token not found');
    }

    return token;
  } catch (error) {
    console.error('❌ Error getting GitHub token:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function setupGitHub() {
  try {
    const token = await getGitHubToken();
    
    console.log('\n✓ GitHub token obtained');
    console.log(`✓ Configuring git...`);

    // Configure git
    try {
      execSync('git config user.name', { encoding: 'utf8' });
    } catch {
      execSync('git config --global user.name "Pourfoliolic Bot"');
    }

    try {
      execSync('git config user.email', { encoding: 'utf8' });
    } catch {
      execSync('git config --global user.email "bot@pourfoliolic.com"');
    }

    console.log(`✓ Adding GitHub remote...`);
    
    // Remove existing remote if it exists
    try {
      execSync('git remote remove github', { stdio: 'pipe' });
    } catch {
      // Doesn't exist yet
    }

    const repoUrl = `https://x-access-token:${token}@github.com/${username}/${repoName}.git`;
    execSync(`git remote add github "${repoUrl}"`);

    console.log(`✓ Staging changes...`);
    execSync('git add -A');

    console.log(`✓ Committing...`);
    try {
      execSync('git commit -m "Initial Pourfoliolic commit with PWA features"', { stdio: 'pipe' });
    } catch {
      console.log('✓ No new changes to commit (already synced)');
    }

    console.log(`✓ Pushing to GitHub...`);
    execSync(`git push -u github main --force`, { stdio: 'inherit' });

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                    ✅ Success!                             ║
╚════════════════════════════════════════════════════════════╝

Your Pourfoliolic code is now on GitHub!

📍 Repository: https://github.com/${username}/${repoName}

🔄 Automatic Syncing:
   - GitHub Actions workflow is set up
   - Checks every 6 hours for updates
   - Manual trigger available in Actions tab

📦 Next Steps:
   1. Visit your repo on GitHub
   2. GitHub Actions tab will show sync status
   3. Changes from Replit sync automatically
   
Questions? Check GITHUB_SETUP.md for detailed instructions.
    `);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

setupGitHub();
