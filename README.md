# 🏆 Tornelo Ranking Combiner

Fully automated tool to combine standings from multiple Tornelo tournament sections and display them on WordPress.

## ✨ Live Demo

**[View Live Standings](https://trioschaak.nl/tornelo-stand/)**

## 🎯 How It Works

```
┌─────────────────┐
│ GitHub Actions  │  Every 2 hours
│  (Cloud Server) │  → Runs scraper.js
└────────┬────────┘  → Updates tornelo-data.json
         │           → Commits to GitHub
         ▼
┌─────────────────┐
│  GitHub Pages   │  Hosts: tornelo-data.json
│  (Static Host)  │  URL: https://geerdink.github.io/tornelo-ranking/tornelo-data.json
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   WordPress     │  Widget fetches JSON
│   (Your Site)   │  Displays combined standings
└─────────────────┘
```

**100% automated - no manual work required!**

## 🚀 Setup

### 1. WordPress Widget

Copy the contents of `wordpress-widget-json.html` and paste it into a **Custom HTML block** on your WordPress page.

That's it! The widget will automatically fetch and display the latest standings.

### 2. Automatic Updates

GitHub Actions runs the scraper every 2 hours automatically. No server or Mac required.

**Manual trigger:** Go to [Actions](../../actions) → "Update Tornelo Standings" → "Run workflow"

6. **Upload to WordPress:**
   - Copy content from `standings.html`
   - Paste into WordPress Custom HTML block

## 📁 Project Files

| File | Purpose |
|------|---------|
| `scraper.js` | Puppeteer scraper that extracts standings from Tornelo |
| `tornelo-data.json` | Generated JSON file with combined standings |
| `wordpress-widget-json.html` | WordPress widget code (paste into Custom HTML block) |
| `.github/workflows/update-standings.yml` | GitHub Actions workflow for automatic updates |
| `package.json` | Node.js dependencies |

## 🔧 Development

### Running Locally

```bash
# Install dependencies
npm install

# Run scraper
node scraper.js
```

This generates `tornelo-data.json` with the latest standings.

### Configuration

Edit `scraper.js` to change sections or tournament:

```javascript
const CONFIG = {
    baseUrl: 'https://tornelo.com/chess/orgs/trio/events/intern-2025-2026',
    sections: ['blok-1', 'blok-2'], // Add more sections here
    timeout: 30000,
    headless: true
};
```

### Widget Configuration

Edit the JSON URL in `wordpress-widget-json.html`:

```javascript
jsonUrl: 'https://geerdink.github.io/tornelo-ranking/tornelo-data.json'
```

## 🔄 Update Schedule

- **Automatic:** Every 2 hours via GitHub Actions
- **Manual:** [Trigger workflow](../../actions/workflows/update-standings.yml)

## 📊 Data Format

The `tornelo-data.json` file contains:

```json
{
  "standings": [
    {
      "name": "Player Name",
      "rating": 1800,
      "total": 11.0,
      "sections": {
        "Blok 1": 7.5,
        "Blok 2": 3.5
      },
      "rank": 1
    }
  ],
  "sections": ["Blok 1", "Blok 2"],
  "updatedAt": "2026-01-27T16:00:00.000Z"
}
```

## 🐛 Troubleshooting

**Widget not loading:**
- Check browser console for errors
- Verify JSON URL is accessible
- Try clearing browser cache (Ctrl+Shift+R)

**Wrong data displayed:**
- Check GitHub Actions logs
- Verify tornelo-data.json is updated
- Wait a few minutes for GitHub Pages to update

**Scores incorrect:**
- Check the Tornelo source pages
- GitHub Actions may need to run again
- Manually trigger workflow if needed

---

**Built with:** Node.js, Puppeteer, GitHub Actions, GitHub Pages
