# 🏆 Tornelo Ranking Combiner

Fully automated tool to combine standings from multiple Tornelo tournament sections.

** ⭐ Perfect for WordPress sites - fetches data in real-time!**

1. **Upload 2 files to WordPress:**
   - `tornelo-live.js` (the widget)
   - `tornelo-proxy.php` (CORS proxy)

2. **Add to any page:**
   ```html
   <div id="tornelo-standings"></div>
   <script src="/wp-content/uploads/tornelo-live.js"></script>
   ```

3. **Done!** Standings update automatically every 30 minutes.

---

## 🚀 Alternative Methods

### Method 1: Browser Console (Quick One-Time Setup)

**No installation needed! Just JavaScript in your browser:**

1. **Open the first section:**
   - Go to: https://tornelo.com/chess/orgs/trio/events/intern-2025-2026/standings/section/blok-1
   - Wait for standings to load

2. **Extract data:**
   - Press `F12` (or `Cmd+Option+I` on Mac)
   - Click "Console" tab
   - Copy contents of `extract_standings.js` and paste
   - Press Enter
   - JSON is auto-copied to clipboard!

3. **Save the data:**
   - Create a file `blok-1.json` and paste the JSON

4. **Repeat for blok-2:**
   - Go to blok-2 URL
   - Run the script again
   - Save as `blok-2.json`

5. **Combine the data:**
   ```bash
   python combine_json.py
   ```

6. **Upload to WordPress:**
   - Copy content from `standings.html`
   - Paste into WordPress Custom HTML block

**Done! ✅ Total time: 2-3 minutes**

---

### Method 2: Fully Automated (Puppeteer)

**Requires Node.js but fully automated:**

```bash
# One-time setup
npm install

# Run scraper (fully automated!)
node scraper.js
```

⚠️ **Note:** May require troubleshooting if page structure changes.

---

## 📦 What You Get

Both methods generate:
- **standings.html** - Beautiful WordPress-ready table with:
  - 🥇🥈🥉 Medal emojis for top 3
  - Purple gradient header
  - Responsive design
  - Individual section scores + total
  
- **standings.json** - Raw data for other uses

---

## 🎯 Detailed Instructions

### Browser Console Method (Recommended)

<details>
<summary>Click for detailed steps with screenshots</summary>

#### Step 1: Open Tornelo Page
Navigate to the first section:
```
https://tornelo.com/chess/orgs/trio/events/intern-2025-2026/standings/section/blok-1
```

#### Step 2: Open DevTools
- **Windows/Linux:** Press `F12`
- **Mac:** Press `Cmd + Option + I`
- Or right-click anywhere → "Inspect"

#### Step 3: Go to Console
Click the "Console" tab in DevTools

#### Step 4: Run the Script
1. Open `extract_standings.js` in a text editor
2. Select all (`Cmd+A` or `Ctrl+A`)
3. Copy (`Cmd+C` or `Ctrl+C`)
4. Paste in Console (`Cmd+V` or `Ctrl+V`)
5. Press `Enter`

#### Step 5: Save the Output
The script will:
- Extract all player data
- Show a preview
- Copy JSON to clipboard automatically

Create a file `blok-1.json` and paste the JSON.

#### Step 6: Repeat for Other Sections
Repeat steps 1-5 for:
- blok-2: Save as `blok-2.json`
- Add more sections as needed

#### Step 7: Combine
```bash
python combine_json.py
```

This creates `standings.html` ready for WordPress!

</details>

---

## 🌐 WordPress Integration

1. In WordPress, edit/create a page
2. Add a **"Custom HTML"** block (not "Code" or "Paragraph")
3. Paste entire content from `standings.html`
4. Publish!

The HTML includes all CSS styling - no theme changes needed.

---

## 🔧 Configuration

### Adding More Sections

**For browser console method:**
Just run the script on more pages and save as `blok-3.json`, etc.

**For Puppeteer method:**
Edit `scraper.js`:
```javascript
const CONFIG = {
    sections: ['blok-1', 'blok-2', 'blok-3'], // Add more here
    // ...
};
```

### Customizing Appearance

Edit the `<style>` section in `combine_json.py`:
```css
/* Change header color */
background: linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_COLOR2 100%);

/* Change font */
font-family: 'Your Font', Arial, sans-serif;
```

---

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `extract_standings.js` | ⭐ Browser console script (recommended) |
| `combine_json.py` | Combines JSON files into HTML |
| `scraper.js` | Automated Puppeteer scraper |
| `package.json` | Node.js dependencies |
| `requirements.txt` | Python dependencies |

---

## 🐛 Troubleshooting

### Browser Console Method

**"No tables found"**
- Make sure page is fully loaded (you can see standings)
- Try refreshing the page
- Check if you're signed in (if required)

**JSON looks wrong**
- Check the preview in console
- Make sure you copied everything
- Should start with `[` and end with `]`

### Puppeteer Method

**"No data extracted"**
- Check `debug-*.png` screenshots
- Try with `headless: false` in `scraper.js`
- Page structure may have changed - use browser console method

---

## 🔄 Automating Updates

### Option 1: Scheduled Browser Script

Use a macro tool to:
1. Open pages
2. Run console script
3. Save JSON
4. Run combine script

### Option 2: Puppeteer + Cron

```bash
# Edit crontab
crontab -e

# Run every Monday at 8 AM
0 8 * * 1 cd /path/to/tornelo-ranking && node scraper.js
```

---

## ❓ FAQ

**Q: Which method should I use?**  
A: Browser console method - it's simpler and more reliable.

**Q: Do I need to install anything?**  
A: Only Python (for combining). The extraction runs in your browser!

**Q: How long does it take?**  
A: 2-3 minutes total for browser method.

**Q: Can I automate it completely?**  
A: Puppeteer method attempts full automation, but may need maintenance.

**Q: What if page structure changes?**  
A: Browser console method is more resilient. Update the script if needed.

---

## 📞 Support

If you encounter issues:
1. Check the generated `standings.json` file
2. Look at `debug-*.png` screenshots (Puppeteer)
3. Run browser console with DevTools open to see errors

---

**Happy ranking! 🏆**

### WordPress Integration

#### Option 1: Manual Copy-Paste
1. Run the script to generate `standings.html`
2. Copy the content
3. Paste into a WordPress page/post using the HTML block

#### Option 2: Automated with WordPress REST API

Create a WordPress plugin or use the REST API to automatically update standings:

```python
import requests

# WordPress configuration
WP_URL = 'https://yoursite.com'
WP_USER = 'your-username'
WP_APP_PASSWORD = 'your-app-password'
PAGE_ID = 123  # Your standings page ID

# Upload standings
with open('standings.html', 'r') as f:
    html_content = f.read()

response = requests.post(
    f'{WP_URL}/wp-json/wp/v2/pages/{PAGE_ID}',
    auth=(WP_USER, WP_APP_PASSWORD),
    json={'content': html_content}
)
```

#### Option 3: Scheduled Updates

Use cron (Linux/Mac) or Task Scheduler (Windows) to run automatically:

```bash
# Add to crontab (edit with: crontab -e)
# Run every day at 8 AM
0 8 * * * cd /path/to/tornelo-ranking && python tornelo_scraper.py
```

### Styling

Add this CSS to your WordPress theme for better table styling:

```css
.tornelo-standings {
    margin: 20px 0;
}

.standings-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
}

.standings-table th {
    background-color: #333;
    color: white;
    padding: 12px;
    text-align: left;
    font-weight: bold;
}

.standings-table td {
    padding: 10px;
    border-bottom: 1px solid #ddd;
}

.standings-table tr:hover {
    background-color: #f5f5f5;
}

.standings-table tr:nth-child(even) {
    background-color: #f9f9f9;
}
```

## Configuration

Edit the `main()` function in `tornelo_scraper.py` to:
- Add more sections
- Change the base URL
- Customize output format

## Output Files

- `standings.html` - WordPress-ready HTML table
- `standings.json` - Raw data in JSON format

## Notes

- The script attempts to use Tornelo's API if available
- Falls back to HTML parsing if API is not accessible
- Handles various point formats (5.5, 5½, etc.)
- Automatically sorts by total points
