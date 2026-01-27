/**
 * Tornelo Live Standings - WordPress Embeddable Script
 * 
 * This script fetches standings from Tornelo in real-time and displays them
 * on your WordPress site. No manual updates needed!
 * 
 * INSTALLATION:
 * 1. Upload this file to WordPress Media Library or host it
 * 2. In WordPress page, add Custom HTML block with:
 *    <div id="tornelo-standings"></div>
 *    <script src="URL-TO-THIS-FILE/tornelo-live.js"></script>
 */

(function() {
    'use strict';

    // ============================================================================
    // CONFIGURATION - Edit these values
    // ============================================================================
    
    const CONFIG = {
        // Your Tornelo URLs
        sections: [
            {
                name: 'Blok 1',
                url: 'https://tornelo.com/chess/orgs/trio/events/intern-2025-2026/standings/section/blok-1'
            },
            {
                name: 'Blok 2',
                url: 'https://tornelo.com/chess/orgs/trio/events/intern-2025-2026/standings/section/blok-2'
            }
        ],
        
        // Use proxy to avoid CORS issues (auto-detects if running locally)
        useProxy: true,
        proxyUrl: '/wp-content/uploads/tornelo-proxy.php',
        
        // Cache duration in minutes (0 = no cache)
        cacheDuration: 30,
        
        // Cache version (increment to force refresh)
        cacheVersion: 3,
        
        // Auto-refresh interval in minutes (0 = no auto-refresh)
        autoRefresh: 0,
        
        // Target element ID
        targetElementId: 'tornelo-standings'
    };

    // Auto-detect local testing
    const isLocalServer = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalServer) {
        console.log('🔧 Running on localhost - using local JSON file');
        CONFIG.useProxy = false;
        CONFIG.apiEndpoint = 'standings-widget.json';
    }

    // ============================================================================
    // Main Code - No need to edit below
    // ============================================================================

    class TorneloLiveStandings {
        constructor(config) {
            this.config = config;
            this.cache = this.loadCache();
        }

        async init() {
            const container = document.getElementById(this.config.targetElementId);
            if (!container) {
                console.error(`Tornelo: Element #${this.config.targetElementId} not found`);
                return;
            }

            console.log('Tornelo: Initializing widget...');
            this.showLoading(container);

            try {
                const standings = await this.fetchAndCombineStandings();
                console.log('Tornelo: Got standings data:', standings);
                
                if (!standings || !standings.standings || standings.standings.length === 0) {
                    throw new Error('No standings data received');
                }
                
                this.renderStandings(container, standings);
                console.log('Tornelo: Rendering complete');
                
                // Setup auto-refresh
                if (this.config.autoRefresh > 0) {
                    setInterval(() => {
                        this.refreshStandings();
                    }, this.config.autoRefresh * 60 * 1000);
                }
            } catch (error) {
                console.error('Tornelo: Error during init:', error);
                this.showError(container, error);
            }
        }

        showLoading(container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 20px; color: #666;">Laden van stand...</p>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </div>
            `;
        }

        showError(container, error) {
            console.error('Tornelo error:', error);
            
            let errorMessage = error.message;
            let helpText = '<p>Er is een probleem opgetreden bij het ophalen van de stand van Tornelo.</p>';
            
            // Provide helpful messages for common issues
            if (window.location.protocol === 'file:') {
                helpText = `
                    <p><strong>⚠️ Je test lokaal vanaf je computer.</strong></p>
                    <p>Voor lokaal testen heb je een webserver nodig. Opties:</p>
                    <ol>
                        <li><strong>Python:</strong> <code>python3 -m http.server 8000</code> en open http://localhost:8000/test.html</li>
                        <li><strong>Node.js:</strong> <code>npx serve .</code></li>
                        <li><strong>PHP:</strong> <code>php -S localhost:8000</code></li>
                    </ol>
                    <p>Of upload direct naar WordPress om te testen.</p>
                `;
            } else if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
                helpText = `
                    <p>CORS beleid blokkeert het ophalen van data.</p>
                    <p><strong>Oplossing:</strong> Zorg dat <code>tornelo-proxy.php</code> correct is geüpload en de <code>proxyUrl</code> klopt in de configuratie.</p>
                `;
            }
            
            container.innerHTML = `
                <div style="padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 8px; color: #c00;">
                    <h3 style="margin-top: 0;">⚠️ Kon stand niet laden</h3>
                    ${helpText}
                    <p style="font-size: 0.9em; color: #666; margin-top: 15px;">Foutmelding: ${errorMessage}</p>
                    <button onclick="location.reload()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">Opnieuw proberen</button>
                </div>
            `;
        }

        async fetchAndCombineStandings() {
            // Check cache first
            if (this.isCacheValid()) {
                console.log('Tornelo: Using cached data');
                // Validate cached data has standings
                if (this.cache.data && this.cache.data.standings && this.cache.data.standings.length > 0) {
                    return this.cache.data;
                } else {
                    console.warn('Tornelo: Cache exists but is empty, fetching fresh data');
                    this.cache = null;
                }
            }

            // If API endpoint is configured, use it directly
            if (this.config.apiEndpoint) {
                console.log(`Tornelo: Fetching from API: ${this.config.apiEndpoint}`);
                try {
                    const response = await fetch(this.config.apiEndpoint);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    console.log(`Tornelo: Got ${data.standings.length} players from API`);
                    this.saveCache(data);
                    return data;
                } catch (error) {
                    console.error('Tornelo: API fetch error:', error);
                    throw error;
                }
            }

            // Otherwise, scrape HTML from each section
            console.log('Tornelo: Fetching fresh data from Tornelo...');
            const allSections = {};

            for (const section of this.config.sections) {
                try {
                    const standings = await this.fetchSection(section.url);
                    allSections[section.name] = standings;
                    console.log(`Tornelo: Loaded ${standings.length} players from ${section.name}`);
                } catch (error) {
                    console.error(`Tornelo: Failed to load ${section.name}:`, error);
                    allSections[section.name] = [];
                }
            }

            const combined = this.combineStandings(allSections);
            this.saveCache(combined);
            return combined;
        }

        async fetchSection(url) {
            const fetchUrl = this.config.useProxy 
                ? `${this.config.proxyUrl}?url=${encodeURIComponent(url)}`
                : url;

            console.log(`Tornelo: Fetching ${url}`);
            console.log(`Tornelo: Proxy enabled: ${this.config.useProxy}`);
            console.log(`Tornelo: Using URL: ${fetchUrl}`);

            try {
                const response = await fetch(fetchUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml',
                    },
                    mode: this.config.useProxy ? 'cors' : 'cors'
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const html = await response.text();
                console.log(`Tornelo: Received ${html.length} bytes of HTML`);
                const standings = this.parseStandingsFromHTML(html);
                console.log(`Tornelo: Parsed ${standings.length} players`);
                return standings;
            } catch (error) {
                console.error(`Tornelo: Fetch error for ${url}:`, error);
                
                // If CORS blocked and not using proxy, provide helpful message
                if (!this.config.useProxy && error.message.includes('CORS')) {
                    console.warn('Tornelo: CORS blocked. This is expected when testing locally.');
                    console.warn('Tornelo: For production, use the proxy or test with a local web server.');
                }
                
                throw error;
            }
        }

        parseStandingsFromHTML(html) {
            // Parse HTML string
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const standings = [];
            const tables = doc.querySelectorAll('table');

            if (tables.length === 0) {
                console.warn('Tornelo: No tables found in HTML');
                return standings;
            }

            // Try each table
            tables.forEach(table => {
                const rows = table.querySelectorAll('tbody tr, tr');
                
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td, th');
                    if (cells.length < 2) return;

                    const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());

                    // Skip header rows
                    const headerKeywords = ['rank', 'plaats', 'player', 'name', 'naam', 'speler'];
                    const isHeader = cellTexts.some(text => 
                        headerKeywords.some(kw => text.toLowerCase().includes(kw))
                    );
                    if (isHeader) return;

                    // Extract data
                    let rank = null;
                    let name = null;
                    let points = null;

                    cellTexts.forEach(text => {
                        // Rank
                        if (!rank && /^\d+$/.test(text)) {
                            rank = parseInt(text);
                        }

                        // Points
                        if (!points && /\d+[.,½]?\d*/.test(text)) {
                            const cleaned = text.replace(',', '.').replace('½', '.5');
                            const num = parseFloat(cleaned);
                            if (!isNaN(num) && num > 0 && num < 100) {
                                points = num;
                            }
                        }

                        // Name
                        if (text.length > 3 && !/^[\d.,½]+$/.test(text)) {
                            if (!name || text.length > name.length) {
                                name = text;
                            }
                        }
                    });

                    if (name && points !== null) {
                        standings.push({ rank: rank || standings.length + 1, name, points });
                    }
                });
            });

            return standings;
        }

        combineStandings(allSections) {
            const playerTotals = new Map();

            for (const [section, players] of Object.entries(allSections)) {
                for (const player of players) {
                    if (!playerTotals.has(player.name)) {
                        playerTotals.set(player.name, {
                            name: player.name,
                            total_points: 0,
                            sections: {}
                        });
                    }

                    const data = playerTotals.get(player.name);
                    data.total_points += player.points;
                    data.sections[section] = player.points;
                }
            }

            const combined = Array.from(playerTotals.values())
                .sort((a, b) => b.total_points - a.total_points)
                .map((player, index) => ({ rank: index + 1, ...player }));

            return {
                standings: combined,
                sections: Object.keys(allSections),
                updatedAt: new Date().toISOString()
            };
        }

        renderStandings(container, data) {
            const { standings, sections, updatedAt } = data;
            const updateDate = new Date(updatedAt);
            const dateStr = updateDate.toLocaleString('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const sectionHeaders = sections.map(s => `<th>${s}</th>`).join('\n                    ');
            
            const rows = standings.map(player => {
                const rankDisplay = player.rank === 1 ? '🥇' : 
                                  player.rank === 2 ? '🥈' : 
                                  player.rank === 3 ? '🥉' : player.rank;

                const sectionCells = sections.map(section => {
                    const points = player.sections[section] || 0;
                    return `<td>${points > 0 ? points.toFixed(1) : '-'}</td>`;
                }).join('\n                    ');

                return `
                <tr>
                    <td>${rankDisplay}</td>
                    <td>${player.name}</td>
                    ${sectionCells}
                    <td><strong>${player.total_points.toFixed(1)}</strong></td>
                </tr>`;
            }).join('');

            container.innerHTML = `
<style>
.tornelo-standings {
    margin: 20px auto;
    max-width: 1200px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}
.standings-header {
    text-align: center;
    margin-bottom: 30px;
}
.standings-header h2 {
    color: #2d3748;
    margin-bottom: 10px;
}
.standings-header p {
    color: #718096;
}
.standings-table {
    width: 100%;
    border-collapse: collapse;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    background: white;
}
.standings-table th {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 12px;
    text-align: left;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.85em;
    letter-spacing: 0.5px;
}
.standings-table td {
    padding: 14px 12px;
    border-bottom: 1px solid #e2e8f0;
}
.standings-table tbody tr:hover {
    background-color: #f7fafc;
}
.standings-table tbody tr:nth-child(even) {
    background-color: #f9fafb;
}
.standings-table td:first-child {
    font-weight: 700;
    color: #4a5568;
    width: 60px;
    text-align: center;
}
.standings-table td:nth-child(2) {
    font-weight: 500;
    color: #2d3748;
}
.standings-table td:not(:first-child):not(:nth-child(2)) {
    text-align: center;
    color: #4a5568;
}
.standings-table td:last-child {
    font-weight: 700;
    color: #38a169;
    font-size: 1.1em;
}
.standings-footer {
    text-align: center;
    color: #a0aec0;
    font-size: 0.9em;
    margin-top: 20px;
}
.refresh-button {
    background: #667eea;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    margin-top: 10px;
}
.refresh-button:hover {
    background: #5568d3;
}
</style>

<div class="tornelo-standings">
    <div class="standings-header">
        <h2>🏆 Seizoenstand</h2>
        <p>Live gegevens van Tornelo</p>
    </div>
    
    <table class="standings-table">
        <thead>
            <tr>
                <th>Rang</th>
                <th>Speler</th>
                ${sectionHeaders}
                <th>Totaal</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
    
    <div class="standings-footer">
        <p>Laatst bijgewerkt: ${dateStr}</p>
        <button class="refresh-button" onclick="location.reload()">🔄 Vernieuwen</button>
    </div>
</div>
            `;
        }

        // Cache management
        loadCache() {
            try {
                const cached = localStorage.getItem('tornelo_standings_cache');
                if (!cached) return null;
                
                const parsed = JSON.parse(cached);
                // Check cache version
                if (parsed.version !== this.config.cacheVersion) {
                    console.log(`Tornelo: Cache version mismatch (${parsed.version} vs ${this.config.cacheVersion}), invalidating`);
                    localStorage.removeItem('tornelo_standings_cache');
                    return null;
                }
                return parsed;
            } catch {
                return null;
            }
        }

        saveCache(data) {
            try {
                const cache = {
                    data: data,
                    timestamp: Date.now(),
                    version: this.config.cacheVersion
                };
                localStorage.setItem('tornelo_standings_cache', JSON.stringify(cache));
            } catch (e) {
                console.warn('Tornelo: Could not save cache', e);
            }
        }

        isCacheValid() {
            if (!this.cache || !this.config.cacheDuration) return false;
            const age = (Date.now() - this.cache.timestamp) / 1000 / 60; // minutes
            return age < this.config.cacheDuration;
        }

        async refreshStandings() {
            const container = document.getElementById(this.config.targetElementId);
            if (!container) return;

            try {
                this.cache = null; // Clear cache to force refresh
                const standings = await this.fetchAndCombineStandings();
                this.renderStandings(container, standings);
            } catch (error) {
                console.error('Tornelo refresh failed:', error);
            }
        }
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const widget = new TorneloLiveStandings(CONFIG);
            widget.init();
        });
    } else {
        const widget = new TorneloLiveStandings(CONFIG);
        widget.init();
    }

})();
