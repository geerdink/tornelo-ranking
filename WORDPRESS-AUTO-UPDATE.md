# WordPress Auto-Update Setup (Server-Side)

Since WordPress can't run Node.js/Puppeteer, we use this architecture:

**GitHub Actions (cloud) → Scrape & Update GitHub Pages → WordPress Cron → Fetch & Save**

## Complete Setup

### Step 1: Setup GitHub Repository

1. **Create GitHub repo** (if not already done):
```bash
cd /Users/bgeerdink/Projects/bas/tornelo-ranking
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/tornelo-ranking.git
git push -u origin main
```

2. **Enable GitHub Pages:**
   - Go to: Repository → Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` → `/` (root)
   - Save

### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/update-standings.yml`:

```yaml
name: Update Tornelo Standings

on:
  schedule:
    - cron: '0 */2 * * *'  # Every 2 hours
  workflow_dispatch:  # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write  # Allow pushing to repo
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run scraper
        run: node scraper.js
        
      - name: Commit updated data
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add tornelo-data.json
          git diff --quiet && git diff --staged --quiet || git commit -m "Auto-update standings $(date +'%Y-%m-%d %H:%M')"
          git push
```

**This automatically:**
- ✅ Scrapes Tornelo every 2 hours
- ✅ Updates `tornelo-data.json` in your repo
- ✅ File available at: `https://YOUR-USERNAME.github.io/tornelo-ranking/tornelo-data.json`

### Step 3: Setup WordPress Cron

1. **Go to WordPress → Snippets → Add New**
2. **Name:** "Tornelo Auto-Updater"
3. **Code:** Paste contents of `wordpress-cron-updater.php`
4. **Important:** Edit line 37, replace:
   ```php
   $source_url = 'https://YOUR-USERNAME.github.io/tornelo-ranking/tornelo-data.json';
   ```
   With your actual GitHub Pages URL

5. **Set:** Run everywhere
6. **Activate** the snippet

**This automatically:**
- ✅ Fetches from GitHub Pages every 2 hours
- ✅ Saves to `/wp-content/uploads/tornelo-data.json`
- ✅ Widget displays updated data

### Step 4: Update Widget URL

Edit your WordPress page with the widget, update the JSON URL:

```javascript
jsonUrl: 'https://trioschaak.nl/wp-content/uploads/tornelo-data.json'
```

(Or use the GitHub Pages URL directly if you prefer)

## How It Works

```
┌─────────────────┐
│  GitHub Actions │  Every 2 hours
│  (Cloud Server) │  → Runs scraper.js
└────────┬────────┘  → Commits tornelo-data.json
         │           → Pushes to GitHub
         ▼
┌─────────────────┐
│  GitHub Pages   │  Hosts: tornelo-data.json
│  (Static Host)  │  URL: https://username.github.io/...
└────────┬────────┘
         │
         ▼ (WordPress Cron fetches every 2 hours)
┌─────────────────┐
│   WordPress     │  Saves to: wp-content/uploads/
│   (Your Site)   │  Widget reads from local file
└─────────────────┘
```

## Testing

### Test GitHub Actions:
1. Go to: Repository → Actions
2. Click: "Update Tornelo Standings"
3. Click: "Run workflow"
4. Wait ~2 minutes
5. Check if `tornelo-data.json` was updated in repo

### Test WordPress Cron:
1. Go to: WordPress → Tools → Tornelo Update
2. Click: "Update Now"
3. Should show: "Tornelo standings updated!"

### Test Widget:
1. Visit your page: https://trioschaak.nl/tornelo-stand/
2. Open console, run: `localStorage.clear()`
3. Refresh page
4. Should see updated standings

## Manual Updates

**Trigger GitHub scraper manually:**
- Go to: Repository → Actions → Update Tornelo Standings → Run workflow

**Update WordPress file manually:**
- Go to: WordPress → Tools → Tornelo Update → Update Now

## Monitoring

**GitHub Actions logs:**
- Repository → Actions → Click latest run

**WordPress logs:**
Check PHP error log or use Query Monitor plugin

**Check file age:**
- WordPress → Tools → Tornelo Update (shows last updated time)

## Troubleshooting

**GitHub Actions not running:**
- Check: Repository → Settings → Actions → Allow all actions

**WordPress cron not running:**
- WordPress cron needs traffic to trigger (use WP Crontrol plugin to debug)
- Or add to system cron:
```bash
*/15 * * * * curl https://trioschaak.nl/wp-cron.php >/dev/null 2>&1
```

**CORS errors on widget:**
- File should be served from same domain (wp-content/uploads)
- If using GitHub Pages directly, they allow CORS

## Alternative: Direct GitHub Pages (Simpler)

If WordPress cron is problematic, skip Step 3 and just use GitHub Pages directly:

**Widget URL:**
```javascript
jsonUrl: 'https://YOUR-USERNAME.github.io/tornelo-ranking/tornelo-data.json'
```

**Pros:**
- ✅ Simpler (no WordPress cron needed)
- ✅ GitHub Pages is fast and reliable
- ✅ Automatic CORS support

**Cons:**
- ❌ External dependency
- ❌ Shows GitHub URL in network requests

## Recommended Setup

**Best approach:**
1. ✅ Use GitHub Actions to scrape (most reliable)
2. ✅ Use GitHub Pages to host JSON
3. ✅ Widget fetches directly from GitHub Pages
4. ❌ Skip WordPress cron (adds complexity)

This is **fully automated** and requires **zero maintenance**!
