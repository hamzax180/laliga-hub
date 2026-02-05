/**
 * La Liga Hub - Home Page JavaScript
 * Fetches dashboard data and renders preview sections
 */

const API_BASE_URL = '/api';

// Team emoji mapping
const teamEmojis = {
    'Real Madrid': '⚪', 'Barcelona': '🔵', 'Atletico Madrid': '🔴',
    'Athletic Bilbao': '🦁', 'Villarreal': '🟡', 'Real Sociedad': '🔵',
    'Real Betis': '💚', 'Sevilla': '⚪', 'Valencia': '🦇', 'Girona': '🔴',
    'Osasuna': '🔴', 'Celta Vigo': '🔵', 'Rayo Vallecano': '⚡',
    'Mallorca': '🔴', 'Getafe': '🔵', 'Las Palmas': '🌴',
    'Alaves': '🔵', 'Leganes': '🥒', 'Espanyol': '🔵', 'Valladolid': '💜'
};

// Mobile nav toggle
document.getElementById('navToggle')?.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('active');
});

/**
 * Format Date Helper
 */
function formatDate(dateString) {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Fetch dashboard data
 */
async function fetchDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard`);
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        return await response.json();
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        return null;
    }
}

/**
 * Render latest news
 */
/**
 * Render latest news with Auto-Slide
 */
let newsInterval;
let currentNewsIndex = 0;
let newsData = [];

function renderNews(news) {
    const container = document.getElementById('newsList');
    if (!news || news.length === 0) {
        container.innerHTML = '<p class="no-data">No news available</p>';
        return;
    }

    newsData = news;
    startNewsCarousel();

    // Pause on hover
    container.addEventListener('mouseenter', stopNewsCarousel);
    container.addEventListener('mouseleave', startNewsCarousel);
}

function startNewsCarousel() {
    stopNewsCarousel(); // Clear existing
    showNewsItem(currentNewsIndex); // Show immediate

    newsInterval = setInterval(() => {
        currentNewsIndex = (currentNewsIndex + 1) % newsData.length;
        showNewsItem(currentNewsIndex);
    }, 4000); // 4 seconds
}

function stopNewsCarousel() {
    if (newsInterval) clearInterval(newsInterval);
}

function showNewsItem(index) {
    const container = document.getElementById('newsList');
    const item = newsData[index];
    const hasImageUrl = item.image && item.image.length > 3;

    // Fade out effect could be added here, but direct replace for responsiveness first
    container.innerHTML = `
        <div class="news-item fade-in">
            <div class="news-img-container" style="height: 180px;"> <!-- Fixed height for stability -->
                ${hasImageUrl
            ? `<img src="${item.image}" alt="${item.title}" class="news-img" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1579952363873-27f3bde9be2e?auto=format&fit=crop&q=80&w=800';">`
            : `<span class="news-icon-large">${item.image || '📰'}</span>`
        }
            </div>
            <div class="news-content">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="news-category cat-${item.category || 'league'}">${item.category || 'League'}</span>
                    <span class="news-pagination" style="font-size:0.75rem; color:var(--text-muted);">${index + 1} / ${newsData.length}</span>
                </div>
                <h3 class="news-title" style="margin-top:8px;">${item.title}</h3>
                <p class="news-summary">${item.summary}</p>
                <span class="news-date">${formatDate(item.date)}</span>
            </div>
        </div>
    `;
}

/**
 * Render mini standings
 */
function renderMiniStandings(teams) {
    const container = document.getElementById('miniStandings');
    if (!teams || teams.length === 0) {
        container.innerHTML = '<p class="no-data">No data available</p>';
        return;
    }

    container.innerHTML = teams.map((team, index) => {
        const logoContent = team.logo
            ? `<img src="${team.logo}" alt="${team.name}" class="mini-logo-img">`
            : (teamEmojis[team.name] || '⚽');
        return `
            <div class="mini-team-row ${index < 4 ? 'champions' : ''}">
                <span class="mini-pos">${index + 1}</span>
                <span class="mini-logo">${logoContent}</span>
                <span class="mini-name">${team.name}</span>
                <span class="mini-pts">${team.points} pts</span>
            </div>
        `;
    }).join('');
}

/**
 * Render mini scorers
 */
function renderMiniScorers(scorers) {
    const container = document.getElementById('miniScorers');
    if (!scorers || scorers.length === 0) {
        container.innerHTML = '<p class="no-data">No data available</p>';
        return;
    }

    container.innerHTML = scorers.map((scorer, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        const photoId = `mini-photo-${scorer.id}`;

        // Lazy fetch the real photo
        fetch(`${API_BASE_URL}/player-photo?name=${encodeURIComponent(scorer.name)}`)
            .then(res => res.json())
            .then(data => {
                if (data.photo) {
                    const img = document.getElementById(photoId);
                    if (img) img.src = data.photo;
                }
            });

        return `
            <div class="mini-scorer-row">
                <span class="mini-medal">${medals[index] || ''}</span>
                <img src="${scorer.photo}" id="${photoId}" alt="${scorer.name}" class="mini-scorer-photo" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(scorer.name)}&background=random&color=fff&size=64';">
                <div class="mini-scorer-info">
                    <span class="mini-scorer-name">${scorer.name}</span>
                    <span class="mini-scorer-team">${scorer.team}</span>
                </div>
                <span class="mini-goals">${scorer.goals} goals</span>
            </div>
        `;
    }).join('');
}

/**
 * Render mini fixtures
 */
function renderMiniFixtures(fixtures) {
    const container = document.getElementById('miniFixtures');
    if (!fixtures || fixtures.length === 0) {
        container.innerHTML = '<p class="no-data">No fixtures available</p>';
        return;
    }

    container.innerHTML = fixtures.map(match => {
        const hLogo = match.homeLogo ? `<img src="${match.homeLogo}" class="mini-logo-img">` : (teamEmojis[match.homeTeam] || '⚽');
        const aLogo = match.awayLogo ? `<img src="${match.awayLogo}" class="mini-logo-img">` : (teamEmojis[match.awayTeam] || '⚽');
        return `
            <div class="mini-match">
                <div class="mini-match-teams">
                    <span class="mini-team-item">${hLogo} ${match.homeTeam}</span>
                    <span class="vs">vs</span>
                    <span class="mini-team-item">${match.awayTeam} ${aLogo}</span>
                </div>
                <div class="mini-match-info">
                    <span>${formatDate(match.date)}</span>
                    <span>${match.time}</span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render mini transfers
 */
function renderMiniTransfers(transfers) {
    const container = document.getElementById('miniTransfers');
    if (!transfers || transfers.length === 0) {
        container.innerHTML = '<p class="no-data">No transfers available</p>';
        return;
    }

    const typeIcons = { in: '➡️', out: '⬅️', loan: '🔄', extension: '✍️' };

    container.innerHTML = transfers.map(transfer => `
        <div class="mini-transfer">
            <span class="transfer-type-icon">${typeIcons[transfer.type] || '🔄'}</span>
            <div class="mini-transfer-info">
                <span class="mini-transfer-player">${transfer.image} ${transfer.player}</span>
                <span class="mini-transfer-details">${transfer.fromTeam} → ${transfer.toTeam}</span>
            </div>
            <span class="mini-transfer-fee">${transfer.fee}</span>
        </div>
    `).join('');
}

/**
 * Render mini news (Bottom Section)
 */
function renderMiniNews(newsItems) {
    const container = document.getElementById('miniNews');
    if (!container || !newsItems || newsItems.length === 0) return;

    // Take top 4 items
    const latestNews = newsItems.slice(0, 4);

    container.innerHTML = latestNews.map(item => `
        <div class="mini-news-item">
            <div class="mini-news-img-container">
                <img src="${item.image}" alt="${item.title}" class="mini-news-img" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1579952363873-27f3bde9be2e?auto=format&fit=crop&q=80&w=800';">
                <span class="mini-news-cat">${item.category}</span>
            </div>
            <div class="mini-news-content">
                <h3 class="mini-news-title">${item.title}</h3>
                <span class="mini-news-date">${formatDate(item.date)}</span>
            </div>
        </div>
    `).join('');
}


/**
 * Render stats
 */
function renderStats(stats) {
    if (!stats) return;

    document.getElementById('statGoals').textContent = stats.totalGoals;
    document.getElementById('statMatches').textContent = stats.totalMatches;
    document.getElementById('statAvg').textContent = stats.avgGoalsPerMatch;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Render news filters
 */
function renderNewsFilters(categories) {
    const container = document.getElementById('newsFilters');
    if (!container) return;

    container.innerHTML = categories.map(cat => `
        <span class="filter-chip ${cat === 'All' ? 'active' : ''}" data-category="${cat.toLowerCase()}">${cat}</span>
    `).join('');

    // Add click events
    container.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', async () => {
            // UI Toggle
            container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // Fetch filtered news
            const category = chip.dataset.category;
            const news = await fetchFilteredNews(category);
            renderNews(news);
        });
    });
}

async function fetchFilteredNews(category) {
    try {
        const response = await fetch(`${API_BASE_URL}/news?category=${category}`);
        return await response.json();
    } catch (e) {
        return [];
    }
}

/**
 * Handle subscription
 */
function setupSubscription() {
    const form = document.getElementById('newsletterForm');
    const emailInput = document.getElementById('subscriberEmail');
    const suggestionsContainer = document.getElementById('emailSuggestions');
    const domains = ['gmail.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'yahoo.com'];

    emailInput?.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value.includes('@')) {
            const [user, domainPart] = value.split('@');
            const filtered = domains.filter(d => d.startsWith(domainPart));

            if (filtered.length > 0 && domainPart.length > 0) {
                suggestionsContainer.innerHTML = filtered.map(d => `
                    <div class="suggestion-item" data-value="${user}@${d}">
                        <span>${user}@<strong>${d}</strong></span>
                    </div>
                `).join('');
                suggestionsContainer.classList.add('active');
            } else {
                suggestionsContainer.classList.remove('active');
            }
        } else {
            suggestionsContainer.classList.remove('active');
        }
    });

    suggestionsContainer?.addEventListener('click', (e) => {
        const item = e.target.closest('.suggestion-item');
        if (item) {
            emailInput.value = item.dataset.value;
            suggestionsContainer.classList.remove('active');
            emailInput.focus();
        }
    });

    document.addEventListener('click', (e) => {
        if (!form?.contains(e.target) && !suggestionsContainer?.contains(e.target)) {
            suggestionsContainer?.classList.remove('active');
        }
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        suggestionsContainer.classList.remove('active');

        // Basic validation
        if (!email || !email.includes('@')) {
            showNotification('Please enter a valid La Liga scout email! ⚽');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();

            if (data.success) {
                showNotification('Welcome to the Club! Check your inbox. ✅', 'success');
                sendSystemNotification("Welcome to the Hub! ⚽", {
                    body: "You've successfully subscribed to La Liga matchday alerts. ¡Vamos!",
                    tag: 'welcome-subscription'
                });
                form.reset();
            } else {
                showNotification(data.error || 'Something went wrong.', 'warning');
            }
        } catch (e) {
            showNotification('Connection error. Try again later.', 'warning');
        }
    });
}

/**
 * Initialize
 */
async function init() {
    console.log('🚀 La Liga Hub Home initializing...');

    try {
        const data = await fetchDashboard();

        if (data) {
            renderNews(data.latestNews);
            renderMiniNews(data.latestNews);
            renderMiniStandings(data.topTeams);
            renderMiniScorers(data.topScorers);
            renderMiniFixtures(data.nextFixtures);
            renderMiniTransfers(data.latestTransfers);
            renderStats(data.stats);

            // Load categories
            fetch(`${API_BASE_URL}/news/categories`)
                .then(res => res.json())
                .then(categories => renderNewsFilters(categories))
                .catch(err => console.warn('Categories failed to load', err));

            setupSubscription();
            setupStadiumMode();
            console.log('✅ Home page loaded!');
        } else {
            throw new Error('No data received from dashboard API');
        }
    } catch (error) {
        console.error('Initialization failed:', error);
        // Clean up spinners if failed
        document.querySelectorAll('.loading-spinner').forEach(s => s.innerHTML = '<p class="error-text" style="color: var(--primary);">Service temporarily unavailable. Please refresh.</p>');
    }
}

document.addEventListener('DOMContentLoaded', init);
