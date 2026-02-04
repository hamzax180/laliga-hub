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
function renderNews(news) {
    const container = document.getElementById('newsList');
    if (!news || news.length === 0) {
        container.innerHTML = '<p class="no-data">No news available</p>';
        return;
    }

    container.innerHTML = news.map(item => `
        <div class="news-item">
            <span class="news-icon">${item.image}</span>
            <div class="news-content">
                <h3 class="news-title">${item.title}</h3>
                <p class="news-summary">${item.summary}</p>
                <span class="news-date">${formatDate(item.date)}</span>
            </div>
        </div>
    `).join('');
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

    container.innerHTML = teams.map((team, index) => `
        <div class="mini-team-row ${index < 4 ? 'champions' : ''}">
            <span class="mini-pos">${index + 1}</span>
            <span class="mini-logo">${teamEmojis[team.name] || '⚽'}</span>
            <span class="mini-name">${team.name}</span>
            <span class="mini-pts">${team.points} pts</span>
        </div>
    `).join('');
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
        return `
            <div class="mini-scorer-row">
                <span class="mini-medal">${medals[index] || ''}</span>
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

    container.innerHTML = fixtures.map(match => `
        <div class="mini-match">
            <div class="mini-match-teams">
                <span>${teamEmojis[match.homeTeam] || '⚽'} ${match.homeTeam}</span>
                <span class="vs">vs</span>
                <span>${match.awayTeam} ${teamEmojis[match.awayTeam] || '⚽'}</span>
            </div>
            <div class="mini-match-info">
                <span>${formatDate(match.date)}</span>
                <span>${match.time}</span>
            </div>
        </div>
    `).join('');
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
 * Initialize
 */
async function init() {
    console.log('🚀 La Liga Hub Home initializing...');

    const data = await fetchDashboard();

    if (data) {
        renderNews(data.latestNews);
        renderMiniStandings(data.topTeams);
        renderMiniScorers(data.topScorers);
        renderMiniFixtures(data.nextFixtures);
        renderMiniTransfers(data.latestTransfers);
        renderStats(data.stats);
    }

    console.log('✅ Home page loaded!');
}

document.addEventListener('DOMContentLoaded', init);
