/**
 * La Liga Hub - Fixtures Page JavaScript
 */

const API_BASE_URL = '/api';

const teamEmojis = {
    'Real Madrid': '⚪', 'Barcelona': '🔵', 'Atletico Madrid': '🔴',
    'Athletic Bilbao': '🦁', 'Villarreal': '🟡', 'Real Sociedad': '🔵',
    'Real Betis': '💚', 'Sevilla': '⚪', 'Valencia': '🦇', 'Girona': '🔴',
    'Osasuna': '🔴', 'Celta Vigo': '🔵', 'Rayo Vallecano': '⚡',
    'Mallorca': '🔴', 'Getafe': '🔵', 'Las Palmas': '🌴',
    'Alaves': '🔵', 'Leganes': '🥒', 'Espanyol': '🔵', 'Valladolid': '💜'
};

let allCalendarData = [];

// Mobile nav toggle
document.getElementById('navToggle')?.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('active');
});

async function fetchCalendar() {
    try {
        const response = await fetch(`${API_BASE_URL}/fixtures`);
        if (!response.ok) throw new Error('Failed to fetch fixtures');
        const matches = await response.json();

        // Group matches by date to create the calendar structure
        const grouped = matches.reduce((acc, match) => {
            if (!acc[match.date]) {
                acc[match.date] = {
                    date: match.date,
                    dayName: new Date(match.date).toLocaleDateString('en-US', { weekday: 'long' }),
                    matches: []
                };
            }
            acc[match.date].matches.push(match);
            return acc;
        }, {});

        return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
        console.error('Error fetching calendar:', error);
        return null;
    }
}

async function fetchTeams() {
    try {
        const response = await fetch(`${API_BASE_URL}/teams`);
        if (!response.ok) throw new Error('Failed to fetch teams');
        return await response.json();
    } catch (error) {
        console.error('Error fetching teams:', error);
        return null;
    }
}

function getTeamEmoji(teamName) {
    if (teamEmojis[teamName]) return teamEmojis[teamName];
    for (const [key, emoji] of Object.entries(teamEmojis)) {
        if (teamName.includes(key)) return emoji;
    }
    return '⚽';
}

function renderCalendar(calendar, filterTeam = '') {
    const container = document.getElementById('calendarContainer');

    if (!calendar || calendar.length === 0) {
        container.innerHTML = '<div class="loading-spinner"><span>No fixtures available</span></div>';
        return;
    }

    let filteredCalendar = calendar;
    if (filterTeam) {
        filteredCalendar = calendar.map(day => ({
            ...day,
            matches: day.matches.filter(match =>
                match.homeTeam.toLowerCase().includes(filterTeam.toLowerCase()) ||
                match.awayTeam.toLowerCase().includes(filterTeam.toLowerCase())
            )
        })).filter(day => day.matches.length > 0);
    }

    if (filteredCalendar.length === 0) {
        container.innerHTML = '<div class="loading-spinner"><span>No matches found for selected team</span></div>';
        return;
    }

    container.innerHTML = filteredCalendar.map(day => {
        const dateObj = new Date(day.date);
        const dayNum = dateObj.getDate();
        const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

        return `
            <div class="calendar-day">
                <div class="calendar-day-header">
                    <div class="calendar-date">
                        <span class="calendar-date-day">${dayNum}</span>
                        <span class="calendar-date-month">${monthName}</span>
                    </div>
                    <span class="calendar-day-name">${day.dayName}</span>
                </div>
                <div class="calendar-matches">
                    ${day.matches.map(match => renderMatchCard(match)).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function renderMatchCard(match) {
    const homeLogo = match.homeLogo
        ? `<img src="${match.homeLogo}" alt="${match.homeTeam}" class="team-logo-small">`
        : getTeamEmoji(match.homeTeam);
    const awayLogo = match.awayLogo
        ? `<img src="${match.awayLogo}" alt="${match.awayTeam}" class="team-logo-small">`
        : getTeamEmoji(match.awayTeam);

    const isElClasico = (match.homeTeam.includes('Barcelona') && match.awayTeam.includes('Real Madrid')) ||
        (match.homeTeam.includes('Real Madrid') && match.awayTeam.includes('Barcelona'));

    return `
        <div class="match-card ${isElClasico ? 'el-clasico' : ''}">
            <div class="match-team home">
                <span class="match-team-name">${match.homeTeam}</span>
                <div class="match-team-logo">${homeLogo}</div>
            </div>
            <div class="match-info">
                <span class="match-time">${match.time}</span>
                <span class="match-vs">VS</span>
                <span class="match-stadium">${match.stadium || 'Estadio'}</span>
                <span class="match-matchday">Matchday ${match.matchday}</span>
            </div>
            <div class="match-team away">
                <div class="match-team-logo">${awayLogo}</div>
                <span class="match-team-name">${match.awayTeam}</span>
            </div>
        </div>
    `;
}

/**
 * Render mini news (Bottom Section)
 */
function renderMiniNews(newsItems) {
    const container = document.getElementById('miniNews');
    if (!container) return;

    if (!newsItems || newsItems.length === 0) {
        container.innerHTML = '<p class="no-data">News temporarily unavailable</p>';
        return;
    }

    const latestNews = newsItems.slice(0, 4);

    container.innerHTML = latestNews.map(item => `
        <div class="mini-news-item">
            <div class="mini-news-img-container">
                <img src="${item.image}" alt="${item.title}" class="mini-news-img" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1579952363873-27f3bde9be2e?auto=format&fit=crop&q=80&w=800';">
                <span class="mini-news-cat">${item.category}</span>
            </div>
            <div class="mini-news-content">
                <h3 class="mini-news-title">${item.title}</h3>
                <span class="mini-news-date">${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
        </div>
    `).join('');
}

async function fetchLatestNews() {
    try {
        const response = await fetch('/api/news');
        if (!response.ok) throw new Error('API error');
        return await response.json();
    } catch (e) {
        console.warn('News fetch failed', e);
        return [];
    }
}

function populateTeamFilter(teams) {
    const customSelect = document.getElementById('customTeamSelect');
    const optionsContainer = document.getElementById('teamOptions');
    const trigger = customSelect.querySelector('.select-trigger');
    const triggerText = document.getElementById('selectedTeamText');

    if (!teams || !customSelect) return;

    const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

    // Populate options
    sortedTeams.forEach(team => {
        const option = document.createElement('div');
        option.classList.add('option');
        option.textContent = team.name;
        option.dataset.value = team.name;
        optionsContainer.appendChild(option);
    });

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('open');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });

    // Handle option selection
    optionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('option')) {
            const value = e.target.dataset.value;
            const text = e.target.textContent;

            // Update UI
            triggerText.textContent = text;

            // Update selected state
            document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');

            // Close dropdown
            customSelect.classList.remove('open');

            // Trigger filter
            renderCalendar(allCalendarData, value);
        }
    });
}

async function init() {
    console.log('🚀 Fixtures page initializing...');

    // Load main data independently
    const calendarPromise = fetchCalendar();
    const teamsPromise = fetchTeams();

    Promise.all([calendarPromise, teamsPromise]).then(([calendar, teams]) => {
        allCalendarData = calendar || [];
        renderCalendar(calendar);
        populateTeamFilter(teams);
        console.log('✅ Fixtures data loaded!');
    }).catch(err => {
        console.error('Core data failed to load:', err);
    });

    // Independent news fetch
    fetchLatestNews().then(news => {
        renderMiniNews(news);
        console.log('✅ News grid loaded!');
    });
}

document.addEventListener('DOMContentLoaded', init);
