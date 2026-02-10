const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FOOTBALL_API_KEY ? process.env.FOOTBALL_API_KEY.trim() : null;
const COMPETITION = 'PD'; // La Liga Primera Division
const SEASON = 2025; // 2025/26 Season

// Middleware
app.use(cors());
app.use(express.json());

// Load fallback mock data
const mockTeams = require('./data/teams.json');
const mockScorers = require('./data/scorers.json');
const mockFixtures = require('./data/fixtures.json');
const mockNews = require('./data/news.json');
const mockTransfers = require('./data/transfers.json');

/**
 * Football-Data.org Client (Primary)
 * This provider is more reliable for free tier crests/logos.
 */
const footballApi = axios.create({
    baseURL: 'https://api.football-data.org/v4',
    headers: {
        'X-Auth-Token': API_KEY
    },
    timeout: 10000 // 10 second timeout
});

// Simple In-Memory Cache (Global)
const cache = {
    standings: { data: null, lastFetch: 0 },
    scorers: { data: null, lastFetch: 0 },
    fixtures: { data: null, lastFetch: 0 },
    dashboard: { data: null, lastFetch: 0 },
    news: { data: null, lastFetch: 0 },
    transfers: { data: null, lastFetch: 0 }
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
    const now = Date.now();
    if (cache[key].data && (now - cache[key].lastFetch < CACHE_DURATION)) {
        return cache[key].data;
    }
    return null;
};

const setCachedData = (key, data) => {
    cache[key].data = data;
    cache[key].lastFetch = Date.now();
};

// ============================================
// Data Mapping Helpers (Football-Data.org)
// ============================================

const mapStandings = (apiData) => {
    if (!apiData || !apiData.standings || !apiData.standings[0]) return mockTeams;
    const table = apiData.standings[0].table;
    return table.map(entry => ({
        id: entry.team.id,
        name: entry.team.shortName || entry.team.name,
        logo: entry.team.crest, // High quality SVG crests
        played: entry.playedGames,
        won: entry.won,
        drawn: entry.draw,
        lost: entry.lost,
        goalsFor: entry.goalsFor,
        goalsAgainst: entry.goalsAgainst,
        goalDifference: entry.goalDifference,
        points: entry.points,
        form: entry.form
    }));
};

/**
 * THE ULTIMATE DYNAMIC PHOTO RESOLVER
 * This function handles all top players with verified links and resolves others dynamically.
 */
const getRealtimePlayerPhoto = async (playerName) => {
    // 1. Nickname/Search Mapping (Helps finding the right player)
    const searchOverrides = {
        "vinicius junior": "Vinicius Junior",
        "vinícius júnior": "Vinicius Junior",
        "lamine yamal": "Lamine Yamal",
        "kylian mbappe": "Kylian Mbappe",
        "robert lewandowski": "Robert Lewandowski",
        "rafinha": "Raphinha",
        "raphinha": "Raphinha",
        "inaki williams": "Inaki Williams",
        "iñaki williams": "Inaki Williams"
    };

    const normalizedName = playerName.toLowerCase().trim();
    // Use override if exists, otherwise use original name sanitized
    const queryName = searchOverrides[normalizedName] || normalizedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 2. Dynamic Search (Fuzzy Lookup)
    try {
        const searchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(queryName)}`;
        const response = await axios.get(searchUrl, { timeout: 3500 });

        if (response.data && response.data.player) {
            // Find the best match or first result
            const p = response.data.player[0];
            return p.strRender || p.strThumb || p.strCutout || null;
        }
    } catch (err) {
        // Silently fail to fallback
        console.error(`Photo search failed for ${playerName}`);
    }
    return null;
};

/**
 * LIVE NEWS FETCHING
 * Provides real-time sports news with high-quality images.
 */

// Star Player & Team image fallbacks (reliable Unsplash)
const starImages = {
    "mbappe": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800",
    "mbappé": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800",
    "lewandowski": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=800",
    "yamal": "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&q=80&w=800",
    "vinicius": "https://images.unsplash.com/photo-1517466787929-bc90951d6dbd?auto=format&fit=crop&q=80&w=800",
    "bellingham": "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&q=80&w=800",
    "barcelona": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800",
    "real madrid": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800",
    "atletico": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800",
    "sevilla": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800"
};

const categoryImages = {
    match: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800',
    player: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=800',
    league: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
    transfer: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&q=80&w=800'
};

// Get smart image based on article title
const getSmartImage = (title, category = 'league') => {
    const lowerTitle = title.toLowerCase();
    const matchedKey = Object.keys(starImages).find(key => lowerTitle.includes(key));

    if (matchedKey) return starImages[matchedKey];
    return categoryImages[category] || categoryImages.league;
};

/**
 * LIVE RSS NEWS FETCHER
 * Fetches real La Liga news from Football España RSS feed
 */
const fetchRSSNews = async () => {
    // Try multiple RSS sources in order of relevance
    const rssSources = [
        { url: 'https://www.football-espana.net/feed', name: 'Football España' },
        { url: 'https://www.espn.com/espn/rss/soccer/news', name: 'ESPN Soccer' }
    ];

    for (const source of rssSources) {
        try {
            console.log(`📰 Fetching live news from ${source.name}...`);
            const response = await axios.get(source.url, {
                timeout: 8000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
            });
            const xml = response.data;

            // Simple XML parsing
            const items = xml.split('<item>').slice(1, 11); // Limit to 10 items

            const newsItems = items.map((item, index) => {
                // Extract title (CDATA or plain)
                const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s) || item.match(/<title>(.*?)<\/title>/s);
                const title = titleMatch ? titleMatch[1].trim() : 'La Liga News';

                // Extract description
                const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/s) || item.match(/<description>(.*?)<\/description>/s);
                let summary = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';
                summary = summary.length > 150 ? summary.substring(0, 150) + '...' : summary;

                // Extract link
                const linkMatch = item.match(/<link>(.*?)<\/link>/) || item.match(/<link[^>]*href="([^"]*)"/);
                const link = linkMatch ? linkMatch[1].trim() : '#';

                // Extract image from enclosure, media:thumbnail, or media:content
                const enclosureMatch = item.match(/<enclosure[^>]*url="([^"]*)"/);
                const mediaMatch = item.match(/<media:thumbnail[^>]*url="([^"]*)"/);
                const mediaContentMatch = item.match(/<media:content[^>]*url="([^"]*)"/);
                const imgTagMatch = item.match(/<img[^>]*src="([^"]*)"/);
                let image = enclosureMatch ? enclosureMatch[1] :
                    (mediaMatch ? mediaMatch[1] :
                        (mediaContentMatch ? mediaContentMatch[1] :
                            (imgTagMatch ? imgTagMatch[1] : '')));

                // Extract date
                const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
                const date = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();

                // Determine category from title
                const lowerTitle = title.toLowerCase();
                let category = 'league';
                if (lowerTitle.includes('win') || lowerTitle.includes('score') || lowerTitle.includes('beat') || lowerTitle.includes('vs') || lowerTitle.includes('defeat')) category = 'match';
                else if (lowerTitle.includes('transfer') || lowerTitle.includes('sign') || lowerTitle.includes('deal') || lowerTitle.includes('move') || lowerTitle.includes('target')) category = 'transfer';
                else if (lowerTitle.includes('injury') || lowerTitle.includes('return') || lowerTitle.includes('goal') || lowerTitle.includes('star') || lowerTitle.includes('player')) category = 'player';

                // Use RSS image or smart fallback
                if (!image || image.length < 10) {
                    image = getSmartImage(title, category);
                }

                return {
                    id: `news-${index + 1}`,
                    title,
                    summary,
                    date,
                    category,
                    image,
                    link,
                    source: source.name
                };
            }).filter(item => item.title && item.title !== 'La Liga News' && item.title.length > 5);

            if (newsItems.length > 0) {
                console.log(`✅ Fetched ${newsItems.length} live news items from ${source.name}`);
                return newsItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            }
        } catch (error) {
            console.error(`❌ ${source.name} RSS Fetch Failed:`, error.message);
        }
    }

    // Fallback to mock news with smart images
    console.warn('⚠️ All RSS sources failed, using mock news');
    return fetchLiveNews();
};

/**
 * LIVE TRANSFERS FETCHER (Football España RSS)
 * Fetches La Liga transfer news from Football España and The Guardian
 */
const fetchRSSTransfers = async () => {
    const sources = [
        'https://www.football-espana.net/feed',
        'https://www.theguardian.com/football/laligafootball/rss'
    ];

    const transferKeywords = [
        'sign', 'deal', 'move', 'transfer', 'bid', 'loan', 'close',
        'contract', 'agree', 'join', 'offer', 'confirm', 'swap',
        'release', 'exit', 'talks', 'target', 'interested', 'pursue',
        'want', 'eye', 'set to', 'negotiations', 'extension', 'renew',
        'depart', 'leave', 'buy', 'sell', 'fee', 'clause', 'midfielder',
        'striker', 'defender', 'forward', 'goalkeeper'
    ];

    const laLigaTeams = [
        'real madrid', 'barcelona', 'atletico madrid', 'athletic bilbao',
        'real sociedad', 'villarreal', 'betis', 'sevilla', 'valencia',
        'girona', 'celta vigo', 'mallorca', 'rayo vallecano', 'osasuna',
        'getafe', 'alaves', 'las palmas', 'espanyol', 'leganes', 'valladolid'
    ];

    try {
        let allTransfers = [];

        for (const feedUrl of sources) {
            try {
                console.log(`Fetching transfers from: ${feedUrl}`);
                const response = await axios.get(feedUrl, {
                    timeout: 8000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                });
                const xml = response.data;
                const items = xml.split('<item>').slice(1, 25);

                const transfers = items.map((item, index) => {
                    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s) || item.match(/<title>(.*?)<\/title>/s);
                    const title = titleMatch ? titleMatch[1].trim() : '';
                    if (!title) return null;

                    const lowerTitle = title.toLowerCase();
                    const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/s) || item.match(/<description>(.*?)<\/description>/s);
                    let summary = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';
                    const lowerSummary = summary.toLowerCase();
                    const combined = lowerTitle + ' ' + lowerSummary;

                    // Check if it's transfer-related (title or description)
                    const isTransfer = transferKeywords.some(kw => combined.includes(kw));
                    // Also include if it mentions La Liga teams in a transfer context
                    const mentionsLaLiga = laLigaTeams.some(team => combined.includes(team));

                    if (!isTransfer && !mentionsLaLiga) return null;

                    const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
                    const date = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();

                    // Smart extraction of transfer details from title
                    let player = title;
                    let fromTeam = 'See Details';
                    let toTeam = 'See Details';
                    let type = 'in';
                    let fee = 'See Article';

                    // Try to identify La Liga team mentioned
                    const mentionedTeam = laLigaTeams.find(t => lowerTitle.includes(t));
                    if (mentionedTeam) {
                        toTeam = mentionedTeam.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    }

                    // Determine transfer type from keywords
                    if (lowerTitle.includes('loan')) {
                        type = 'loan';
                    } else if (lowerTitle.includes('extend') || lowerTitle.includes('extension') || lowerTitle.includes('renew')) {
                        type = 'extension';
                    } else if (lowerTitle.includes('leave') || lowerTitle.includes('exit') || lowerTitle.includes('depart') || lowerTitle.includes('sell')) {
                        type = 'out';
                    } else if (lowerTitle.includes('sign') || lowerTitle.includes('join') || lowerTitle.includes('agree') || lowerTitle.includes('confirm') || lowerTitle.includes('buy')) {
                        type = 'in';
                    }

                    // Extract fee if mentioned
                    const feeMatch = combined.match(/€(\d+[\.\d]*\s*[mM])/);
                    if (feeMatch) fee = '€' + feeMatch[1].toUpperCase();
                    else if (combined.includes('free transfer') || combined.includes('free agent')) fee = 'Free Transfer';

                    // Truncate summary
                    if (summary.length > 200) summary = summary.substring(0, 200) + '...';

                    return {
                        id: `trans-${Date.now()}-${index}`,
                        player: player.split(' – ')[0].split(' - ')[0].trim(),
                        fromTeam,
                        toTeam,
                        date,
                        fee,
                        type,
                        image: '⚽',
                        summary
                    };
                }).filter(t => t !== null);

                allTransfers = allTransfers.concat(transfers);
            } catch (feedErr) {
                console.error(`Feed ${feedUrl} failed:`, feedErr.message);
            }
        }

        if (allTransfers.length > 0) {
            // Deduplicate by title similarity and sort by date
            const seen = new Set();
            const unique = allTransfers.filter(t => {
                const key = t.player.toLowerCase().substring(0, 30);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);
        }
    } catch (error) {
        console.error('Transfers RSS Fetch Failed:', error.message);
    }
    return mockTransfers;
};

/**
 * FALLBACK NEWS - Uses mock data with smart images
 */
const fetchLiveNews = async () => {
    return mockNews.map((item, idx) => {
        const image = item.image && item.image.length > 10 ? item.image : getSmartImage(item.title, item.category);
        return {
            ...item,
            image,
            content: `Detailed report about ${item.title}.`,
            author: 'La Liga Hub News Desk'
        };
    });
};

const mapScorers = (apiData) => {
    if (!apiData || !apiData.scorers) return mockScorers;
    return apiData.scorers.map((item) => ({
        id: item.player.id,
        name: item.player.name,
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.player.name)}&background=random&color=fff&size=200&bold=true&rounded=true`,
        team: item.team.name,
        teamLogo: item.team.crest,
        nationality: item.player.nationality,
        position: item.player.section === 'Offence' ? 'Forward' : item.player.section,
        goals: item.goals,
        assists: item.assists || 0,
        matches: item.playedMatches,
        minutesPlayed: null
    }));
};

const mapFixtures = (apiData) => {
    if (!apiData || !apiData.matches) return mockFixtures;
    return apiData.matches.map(item => ({
        id: item.id,
        date: item.utcDate.split('T')[0],
        time: new Date(item.utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        homeTeam: item.homeTeam.shortName || item.homeTeam.name,
        homeLogo: item.homeTeam.crest,
        awayTeam: item.awayTeam.shortName || item.awayTeam.name,
        awayLogo: item.awayTeam.crest,
        homeGoals: item.score.fullTime.home,
        awayGoals: item.score.fullTime.away,
        status: item.status,
        matchday: item.matchday,
        stadium: null
    }));
};

// ============================================
// API Routes
// ============================================

app.get('/api/player-photo', async (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const photoUrl = await getRealtimePlayerPhoto(name);
    if (photoUrl) return res.json({ photo: photoUrl });

    res.json({ photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=200&bold=true` });
});

app.get('/api/news', async (req, res) => {
    const { category } = req.query;

    try {
        let news = getCachedData('news');

        if (!news) {
            console.log('Cache miss for news, fetching from RSS...');
            news = await fetchRSSNews();
            setCachedData('news', news);
        }

        // Apply filtering if category is provided and not 'all'
        if (category && category !== 'all') {
            const filtered = news.filter(n => n.category.toLowerCase() === category.toLowerCase());
            return res.json(filtered);
        }

        res.json(news);
    } catch (error) {
        console.error("News endpoint error:", error);
        // On fatal error, return mock news directly without caching it as 'news'
        const fallback = await fetchLiveNews();
        res.json(fallback);
    }
});

app.get('/api/teams', async (req, res) => {
    try {
        const cached = getCachedData('standings');
        if (cached) return res.json(cached);

        if (API_KEY) {
            const response = await footballApi.get(`/competitions/${COMPETITION}/standings`, { params: { season: SEASON } });
            const mapped = mapStandings(response.data);
            setCachedData('standings', mapped);
            return res.json(mapped);
        }
        res.json(mockTeams);
    } catch (error) {
        res.json(mockTeams);
    }
});

app.get('/api/scorers', async (req, res) => {
    try {
        const cached = getCachedData('scorers');
        if (cached) return res.json(cached);

        if (API_KEY) {
            const response = await footballApi.get(`/competitions/${COMPETITION}/scorers`, { params: { season: SEASON } });
            const mapped = mapScorers(response.data);
            setCachedData('scorers', mapped);
            return res.json(mapped);
        }
        res.json(mockScorers);
    } catch (error) {
        res.json(mockScorers);
    }
});

app.get('/api/fixtures', async (req, res) => {
    try {
        const cached = getCachedData('fixtures');
        if (cached) return res.json(cached);

        if (API_KEY) {
            const response = await footballApi.get(`/competitions/${COMPETITION}/matches`, { params: { season: SEASON } });
            const mapped = mapFixtures(response.data);
            setCachedData('fixtures', mapped);
            return res.json(mapped);
        }
        res.json(mockFixtures);
    } catch (error) {
        res.json(mockFixtures);
    }
});

// Consolidated news endpoint moved up

app.get('/api/news/categories', (req, res) => {
    const categories = ['All', 'Match', 'Player', 'League', 'Transfer', 'Standings', 'Scorers'];
    res.json(categories);
});

app.get('/api/news/articles/:id', async (req, res) => {
    const news = await fetchLiveNews();
    const article = news.find(n => n.id.toString() === req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
});

app.get('/api/transfers', async (req, res) => {
    try {
        let transfers = getCachedData('transfers');
        if (!transfers) {
            transfers = await fetchRSSTransfers();
            setCachedData('transfers', transfers);
        }

        // Ensure sorting is applied to whatever data we have (Live or Mock)
        const sorted = [...transfers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        res.json(sorted);
    } catch (error) {
        const sortedMock = [...mockTransfers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        res.json(sortedMock);
    }
});

app.get('/api/dashboard', async (req, res) => {
    try {
        const cached = getCachedData('dashboard');
        if (cached) return res.json(cached);

        let teamsArr = mockTeams;
        let scorersArr = mockScorers;
        let fixturesArr = mockFixtures;
        let newsArr = mockNews;

        if (API_KEY) {
            const [standingsRes, scorersRes, fixturesRes] = await Promise.allSettled([
                footballApi.get(`/competitions/${COMPETITION}/standings`, { params: { season: SEASON } }),
                footballApi.get(`/competitions/${COMPETITION}/scorers`, { params: { season: SEASON } }),
                footballApi.get(`/competitions/${COMPETITION}/matches`, { params: { status: 'SCHEDULED', limit: 10, season: SEASON } })
            ]);

            if (standingsRes.status === 'fulfilled') teamsArr = mapStandings(standingsRes.value.data);
            if (scorersRes.status === 'fulfilled') scorersArr = mapScorers(scorersRes.value.data);
            if (fixturesRes.status === 'fulfilled') fixturesArr = mapFixtures(fixturesRes.value.data);

            // Fetch live news from RSS
            newsArr = await fetchRSSNews();
        }

        const dashboardData = {
            topTeams: teamsArr.slice(0, 5),
            topScorers: scorersArr.slice(0, 3),
            nextFixtures: fixturesArr.slice(0, 3),
            latestNews: newsArr.slice(0, 3),
            latestTransfers: (await fetchRSSTransfers()).slice(0, 3),
            stats: { totalMatches: 220, totalGoals: 583, avgGoalsPerMatch: 2.65 }
        };

        setCachedData('dashboard', dashboardData);
        res.json(dashboardData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', provider: 'football-data.org', live: !!API_KEY });
});

/**
 * EMAIL SUBSCRIPTION API
 * Allows users to subscribe for matchday alerts.
 */
app.post('/api/subscribe', async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    try {
        // Find today's matches (Barcelona timezone)
        let todayMatches = 0;
        const nowBarcelona = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });

        const cachedFixtures = getCachedData('fixtures');
        if (cachedFixtures) {
            todayMatches = cachedFixtures.filter(f => f.date === nowBarcelona).length;
        }

        let emailSent = false;

        // Send Welcome Email using Brevo API
        if (process.env.EMAIL_PASS && process.env.EMAIL_USER) {
            console.log(`📤 Sending welcome email to ${email} via Brevo API...`);

            const emailData = {
                sender: { name: "La Liga Hub", email: process.env.EMAIL_USER.trim() },
                to: [{ email: email }],
                subject: "Welcome to the Club! ⚽",
                htmlContent: `
                    <div style="font-family: sans-serif; background-color: #0c0d11; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #1f2128;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #ff3c4a; margin-top: 10px; font-size: 28px; letter-spacing: 1px;">LA LIGA HUB</h1>
                        </div>
                        <div style="background-color: #16181d; padding: 30px; border-radius: 8px; border-left: 4px solid #ff3c4a;">
                            <h2 style="color: #ffffff; margin-top: 0;">You're In!</h2>
                            <p style="font-size: 16px; line-height: 1.6; color: #a0a6b5;">
                                Thank you for subscribing to <strong>La Liga Hub</strong>. 
                            </p>
                            <p style="font-size: 16px; line-height: 1.6; color: #a0a6b5;">
                                You will receive real-time updates on matchday fixtures, breaking transfer news, and exclusive player insights.
                            </p>
                            <div style="margin-top: 25px; padding: 15px; background: rgba(255, 60, 74, 0.1); border-radius: 6px; text-align: center;">
                                <p style="color: #ff3c4a; margin: 0; font-weight: 600;">¡Vamos La Liga!</p>
                            </div>
                        </div>
                        <div style="margin-top: 30px; text-align: center; color: #6e7687; font-size: 14px;">
                            <hr style="border: 0; border-top: 1px solid #1f2128; margin: 20px 0;">
                            <p>&copy; 2025 La Liga Hub. Your daily source for Spanish Football.</p>
                        </div>
                    </div>
                `
            };

            try {
                const emailResponse = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
                    headers: {
                        'api-key': process.env.EMAIL_PASS.trim(),
                        'Content-Type': 'application/json',
                        'accept': 'application/json'
                    }
                });
                console.log('✅ Brevo API Success:', emailResponse.data);
                emailSent = true;
            } catch (emailError) {
                console.error('❌ Brevo API Error:', emailError.response ? JSON.stringify(emailError.response.data) : emailError.message);
                emailSent = false;
            }

        } else {
            console.warn('⚠️ Skipping email: EMAIL_USER or EMAIL_PASS not configured');
        }

        res.json({
            success: true,
            message: emailSent ? 'Subscribed! Welcome email sent.' : 'Subscribed!',
            emailSent,
            matchCount: todayMatches
        });
    } catch (error) {
        console.error('❌ Subscribe endpoint error:', error.message);
        res.status(500).json({ success: false, error: 'Subscription failed. Please try again.' });
    }
});

/**
 * TODAY'S MATCHES API
 * Specific endpoint for the subscription service
 */
app.get('/api/matches/today', async (req, res) => {
    // Use Barcelona timezone for "today" to match user expectations
    const nowBarcelona = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
    console.log(`📅 Checking matches for today (Barcelona): ${nowBarcelona}`);
    let fixtures = mockFixtures;

    const cached = getCachedData('fixtures');
    if (cached) fixtures = cached;

    const today = fixtures.filter(f => f.date === nowBarcelona);
    console.log(`⚽ Found ${today.length} matches for today`);
    res.json(today);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} (Live Mode: ${!!API_KEY})`);
    console.log(`🎵 Theme Song & Stadium Audio: Configured via Frontend`);
});

module.exports = app;
