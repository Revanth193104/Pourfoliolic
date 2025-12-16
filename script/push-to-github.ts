import { execSync } from 'child_process';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function pushToGitHub() {
  try {
    const accessToken = await getAccessToken();
    const githubUsername = connectionSettings?.settings?.github_login || connectionSettings.settings?.oauth?.profile?.login;
    
    if (!githubUsername) {
      throw new Error('Could not determine GitHub username');
    }

    console.log(`Pushing to GitHub as ${githubUsername}...`);

    // Configure git with personal access token
    execSync(`git config --global user.name "Pourfoliolic Bot"`);
    execSync(`git config --global user.email "bot@pourfoliolic.com"`);

    // Add remote URL with authentication
    const repoUrl = `https://${githubUsername}:${accessToken}@github.com/${githubUsername}/pourfoliolic.git`;
    
    try {
      execSync('git remote remove origin', { cwd: process.cwd() });
    } catch {
      // Remote might not exist yet
    }

    execSync(`git remote add origin ${repoUrl}`, { cwd: process.cwd() });

    // Add all changes
    execSync('git add .', { cwd: process.cwd() });

    // Check if there are changes to commit
    try {
      execSync('git diff --cached --quiet', { cwd: process.cwd() });
      console.log('No changes to commit');
      return;
    } catch {
      // There are changes, continue
    }

    // Commit changes
    execSync('git commit -m "Update Pourfoliolic app - PWA features and mobile improvements"', { cwd: process.cwd() });

    // Push to GitHub
    execSync('git push -u origin main', { cwd: process.cwd() });

    console.log(`✅ Successfully pushed to GitHub!`);
    console.log(`📍 Repository: https://github.com/${githubUsername}/pourfoliolic`);
  } catch (error) {
    console.error('Error pushing to GitHub:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

pushToGitHub();
