# Tornelo Combined Standings

Combine standings from multiple Tornelo sections into one overview for WordPress.

## 🚀 Quick Start

### 1. Scrape Data
```bash
node scraper.js
```
Creates `standings.json` with combined standings.

### 2. Convert for Widget
```bash
cat standings.json | node -e '
const data = JSON.parse(require("fs").readFileSync(0, "utf-8"));
const output = {
  standings: data.map(p => {
    const sections = {};
    if (p.sections["blok-1"]) sections["Blok 1"] = p.sections["blok-1"];
    if (p.sections["blok-2"]) sections["Blok 2"] = p.sections["blok-2"];
    return {
      rank: p.rank,
      name: p.name,
      total_points: p.total_points,
      sections: sections
    };
  }),
  updatedAt: new Date().toISOString(),
  sections: ["Blok 1", "Blok 2"]
};
console.log(JSON.stringify(output, null, 2));
' > standings-widget.json
```

### 3. Test Locally
```bash
python3 -m http.server 8000
```
Open http://localhost:8000/test.html

### 4. Deploy to WordPress

Upload `standings-widget.json` and `tornelo-live.js` to Media Library.

Add Custom HTML block:
```html
<div id="tornelo-standings"></div>
<script>
(function() {
    const CONFIG = {
        useProxy: false,
        apiEndpoint: 'YOUR-JSON-URL',
        cacheDuration: 30,
        cacheVersion: 1,
        targetElementId: 'tornelo-standings'
    };
    const script = document.createElement('script');
    script.src = 'YOUR-WIDGET-JS-URL';
    document.body.appendChild(script);
})();
</script>
```

## 📁 Essential Files

- `scraper.js` - Extracts data from Tornelo
- `tornelo-live.js` - WordPress widget
- `tornelo-proxy.php` - CORS proxy (optional)
- `test.html` - Local testing
- `standings.json` - Raw data
- `standings-widget.json` - Widget format

## ⚙️ Configuration

Edit `scraper.js` (line 11):
```javascript
const CONFIG = {
    baseUrl: 'https://tornelo.com/chess/orgs/YOUR-ORG/events/YOUR-EVENT',
    sections: ['blok-1', 'blok-2']
};
```

## 🔄 Update Process

1. Run `node scraper.js`
2. Run convert command (step 2 above)
3. Upload new `standings-widget.json` to WordPress

## 🐛 Troubleshooting

**Wrong names** - Tornelo uses dynamic rendering. Parser extracts from text and may grab wrong fields occasionally.

**Cache not updating** - Increment `cacheVersion` in widget CONFIG.

**CORS errors** - Use uploaded JSON file method (recommended).

## 💡 Requirements

- Node.js with Puppeteer
- WordPress with Custom HTML blocks
