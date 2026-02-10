/**
 * Automated Tornelo Standings Scraper
 * Uses Puppeteer to scrape standings from multiple sections
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

// Configuration
const CONFIG = {
    baseUrl: 'https://tornelo.com/chess/orgs/trio/events/intern-2025-2026',
    sections: ['blok-1', 'blok-2', 'blok-3'],
    timeout: 30000, // 30 seconds
    headless: true // Set to false to see the browser
};

/**
 * Extract standings from a page
 */
async function extractStandings(page) {
    // Wait for page to load JavaScript content
    console.log('  ⏳ Waiting for JavaScript to load content (5 seconds)...');
    await page.waitForTimeout(5000); // Wait 5 seconds for JS to execute
    
    // Debug: Check what's on the page
    const debug = await page.evaluate(() => {
        const tables = document.querySelectorAll('table');
        const allText = document.body.innerText;
        return {
            tableCount: tables.length,
            bodyText: allText.substring(0, 500),
            fullText: allText, // Save full text for debugging
            hasRows: document.querySelectorAll('tr').length
        };
    });
    
    console.log(`  📊 Debug: ${debug.tableCount} tables, ${debug.hasRows} rows`);
    console.log(`  📄 Body text: ${debug.bodyText.substring(0, 200)}...`);
    
    // Save full text to file for debugging
    const url = await page.url();
    const sectionName = url.split('/').pop();
    fs.writeFileSync(`debug-text-${sectionName}.txt`, debug.fullText);
    console.log(`  💾 Saved full text to debug-text-${sectionName}.txt`);
    
    // Now check if we have a table
    const hasTable = debug.tableCount > 0;
    
    if (hasTable) {
        console.log('  ✓ Table found!');
    } else {
        console.log('  ⚠ No table found');
    }
    
    // Extract standings using browser context
    const standings = await page.evaluate(() => {
        const results = [];
        
        // Parse from text content since Tornelo doesn't use tables
        const bodyText = document.body.innerText;
        const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        // Find the standings section (starts after "items" indicator)
        let startIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('items') || lines[i].match(/\d+\/\d+/)) {
                startIndex = i + 1;
                break;
            }
        }
        
        if (startIndex === -1) startIndex = 0;
        
        // Parse player entries
        // Structure: Rank, (Flag - optional), Player, Rtg, Gender, Score, Perf, +/-, Trophy
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            console.log(line);
            
            // Look for rank number at start
            if (/^\d+$/.test(line)) {
                const rank = parseInt(line);
                
                // Find the name (next text that's not a number and not Male/Female)
                let nameIndex = -1;
                for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                    const candidate = lines[j];
                    if (candidate && 
                        candidate !== 'Male' && 
                        candidate !== 'Female' &&
                        candidate.length > 2 &&
                        !/^\d+$/.test(candidate) &&
                        !/^[\d.,]+$/.test(candidate) &&
                        !/^[↑↓]/.test(candidate) && // Not arrows (rating change indicators)
                        !/^extern/.test(candidate) && // Skip extern entries
                        /[a-zA-Z]/.test(candidate)) { // Must contain letters
                        nameIndex = j;
                        break;
                    }
                }
                
                if (nameIndex === -1) continue;
                
                const name = lines[nameIndex];
                
                // Find the score - it's after the name, should be a decimal or whole number 0-15
                // Structure: name, rating (3-4 digits), gender, score
                let pointsValue = null;
                let rating = 0;
                let foundRating = false;
                
                for (let j = nameIndex + 1; j < Math.min(nameIndex + 10, lines.length); j++) {
                    const candidate = lines[j];
                    
                    // Skip Male/Female
                    if (candidate === 'Male' || candidate === 'Female') continue;
                    
                    // First pure number 3-4 digits after name is rating
                    if (!foundRating && /^\d{3,4}$/.test(candidate)) {
                        rating = parseInt(candidate);
                        foundRating = true;
                        continue;
                    }
                    
                    // After finding rating, look for score
                    // Matches: "½", "3", "3.5", "3,5", "3½", etc.
                    if (foundRating && /^(½|\d+([.,]\d+|½)?)$/.test(candidate)) {
                        const num = parseFloat(candidate.replace(',', '.').replace('½', '.5'));
                        if (num >= 0 && num <= 15) {
                            pointsValue = num;
                            break;
                        }
                    }
                }
                
                if (pointsValue !== null) {
                    results.push({
                        rank: rank,
                        name: name,
                        points: pointsValue,
                        rating: rating
                    });
                }
            }
        }
        
        return results;
    });
    
    // Deduplicate by name within this section (keep first occurrence with valid score)
    const seen = new Set();
    const deduplicated = standings.filter(player => {
        if (seen.has(player.name)) {
            return false;
        }
        seen.add(player.name);
        return true;
    });
    
    return deduplicated;
}

/**
 * Scrape a single section
 */
async function scrapeSection(browser, section) {
    const url = `${CONFIG.baseUrl}/standings/section/${section}`;
    console.log(`\n📥 Fetching ${section}...`);
    console.log(`   URL: ${url}`);
    
    const page = await browser.newPage();
    
    try {
        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
        
        // Navigate to page
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: CONFIG.timeout 
        });
        
        console.log('  ⏳ Waiting for content to load...');
        
        // Extract standings
        const standings = await extractStandings(page);
        
        if (standings.length === 0) {
            console.log('  ⚠ No standings found. Saving page screenshot for debugging...');
            await page.screenshot({ path: `debug-${section}.png`, fullPage: true });
            console.log(`  📸 Screenshot saved as debug-${section}.png`);
        } else {
            console.log(`  ✅ Extracted ${standings.length} players`);
            
            // Show first few players
            standings.slice(0, 3).forEach(p => {
                console.log(`     ${p.rank}. ${p.name} - ${p.points} points`);
            });
        }
        
        return standings;
        
    } finally {
        await page.close();
    }
}

/**
 * Combine standings from multiple sections
 */
function combineStandings(allSections) {
    const playerTotals = new Map();
    
    for (const [section, players] of Object.entries(allSections)) {
        for (const player of players) {
            if (!playerTotals.has(player.name)) {
                playerTotals.set(player.name, {
                    name: player.name,
                    rating: player.rating || 0,
                    total_points: 0,
                    sections: {}
                });
            }
            
            const playerData = playerTotals.get(player.name);
            playerData.total_points += player.points;
            playerData.sections[section] = player.points;
            // Update rating if higher
            if (player.rating > playerData.rating) {
                playerData.rating = player.rating;
            }
        }
    }
    
    // Convert to array and sort by total points first, then by rating
    const combined = Array.from(playerTotals.values())
        .sort((a, b) => {
            if (b.total_points !== a.total_points) {
                return b.total_points - a.total_points;
            }
            return b.rating - a.rating;
        })
        .map((player, index) => ({
            rank: index + 1,
            ...player
        }));
    
    return combined;
}

/**
 * Generate HTML output
 */
function generateHTML(standings, sections) {
    const sectionHeaders = sections.map(s => 
        `<th>${s.replace('blok-', 'Blok ')}</th>`
    ).join('\n        ');
    
    const rows = standings.map(player => {
        const sectionCells = sections.map(section => {
            const points = player.sections[section] || 0;
            return `<td>${points > 0 ? points.toFixed(1) : '-'}</td>`;
        }).join('\n            ');
        
        const rankDisplay = player.rank === 1 ? '🥇' : 
                           player.rank === 2 ? '🥈' : 
                           player.rank === 3 ? '🥉' : player.rank;
        
        return `        <tr>
            <td>${rankDisplay}</td>
            <td>${player.name}</td>
            ${sectionCells}
            <td><strong>${player.total_points.toFixed(1)}</strong></td>
        </tr>`;
    }).join('\n');
    
    return `<div class="tornelo-standings">
<style>
.tornelo-standings {
    margin: 20px auto;
    max-width: 1200px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}
.standings-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
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
</style>
<h2 style="text-align: center; color: #2d3748;">🏆 Seizoenstand</h2>
<p style="text-align: center; color: #718096; margin-bottom: 30px;">Gecombineerde resultaten van alle blokken</p>
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
<p style="text-align: center; color: #a0aec0; font-size: 0.9em; margin-top: 20px;">
    Laatst bijgewerkt: ${new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
</p>
</div>`;
}

/**
 * Main function
 */
async function main() {
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║     Automated Tornelo Standings Scraper (Puppeteer)              ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('🚀 Launching browser...');
    const browser = await puppeteer.launch({
        headless: CONFIG.headless ? 'new' : false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const allSections = {};
        
        // Scrape each section
        for (const section of CONFIG.sections) {
            const standings = await scrapeSection(browser, section);
            allSections[section] = standings;
        }
        
        // Check if we got any data
        const totalPlayers = Object.values(allSections).reduce((sum, s) => sum + s.length, 0);
        
        if (totalPlayers === 0) {
            console.log('\n❌ No data extracted from any section!');
            console.log('\nPossible issues:');
            console.log('  1. Page structure has changed');
            console.log('  2. Content requires login');
            console.log('  3. Different selectors needed');
            console.log('\nCheck the debug-*.png screenshots for details.');
            return;
        }
        
        // Combine standings
        console.log('\n' + '='.repeat(70));
        console.log('📊 Combining standings...');
        console.log('='.repeat(70));
        
        const combined = combineStandings(allSections);
        
        console.log(`\n✅ Combined ${combined.length} unique players\n`);
        
        // Generate outputs
        const html = generateHTML(combined, CONFIG.sections);
        const json = JSON.stringify(combined, null, 2);
        
        // Generate widget JSON format
        const widgetJSON = {
            standings: combined.map(player => ({
                name: player.name,
                rating: player.rating,
                total: player.total_points,
                sections: Object.fromEntries(
                    Object.entries(player.sections).map(([key, value]) => [
                        key.replace('blok-', 'Blok '),
                        value
                    ])
                ),
                rank: player.rank
            })),
            sections: CONFIG.sections.map(s => s.replace('blok-', 'Blok ')),
            updatedAt: new Date().toISOString()
        };
        
        fs.writeFileSync('standings.html', html);
        fs.writeFileSync('standings.json', json);
        fs.writeFileSync('tornelo-data.json', JSON.stringify(widgetJSON, null, 2));
        
        console.log('📁 Files created:');
        console.log('   ✓ standings.html (WordPress ready)');
        console.log('   ✓ standings.json (raw data)');
        console.log('   ✓ tornelo-data.json (widget format)');
        
        // Display top 10
        console.log('\n' + '='.repeat(70));
        console.log('🏆 TOP 10 PLAYERS');
        console.log('='.repeat(70));
        console.log(`${'Rang'.padEnd(6)} ${'Speler'.padEnd(30)} ${'Totaal'.padStart(8)}`);
        console.log('-'.repeat(70));
        
        combined.slice(0, 10).forEach(player => {
            const sectionScores = CONFIG.sections
                .map(s => (player.sections[s] || 0).toFixed(1))
                .join(' + ');
            console.log(
                `${String(player.rank).padEnd(6)} ` +
                `${player.name.padEnd(30)} ` +
                `${player.total_points.toFixed(1).padStart(8)}`
            );
        });
        
        console.log('\n' + '='.repeat(70));
        console.log('✅ Done! Upload standings.html to WordPress');
        console.log('='.repeat(70));
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
        console.log('\n🔒 Browser closed');
    }
}

// Run the scraper
main().catch(console.error);
