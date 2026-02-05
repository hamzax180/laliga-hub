/**
 * La Liga Hub - Scorers Page JavaScript
 */

const API_BASE_URL = '/api';

// Mobile nav toggle
document.getElementById('navToggle')?.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('active');
});

async function fetchScorers() {
    try {
        const response = await fetch(`${API_BASE_URL}/scorers`);
        if (!response.ok) throw new Error('Failed to fetch scorers');
        return await response.json();
    } catch (error) {
        console.error('Error fetching scorers:', error);
        return null;
    }
}

function renderScorers(scorers) {
    const container = document.getElementById('scorersGrid');

    if (!scorers || scorers.length === 0) {
        container.innerHTML = '<div class="loading-spinner"><span>No data available</span></div>';
        return;
    }

    container.innerHTML = scorers.map((scorer, index) => {
        const rank = index + 1;
        let rankClass = '';

        if (rank === 1) rankClass = 'gold';
        else if (rank === 2) rankClass = 'silver';
        else if (rank === 3) rankClass = 'bronze';

        const photoId = `player-photo-${scorer.id}`;

        // Async fetch the real photo from our new backend API
        fetch(`/api/player-photo?name=${encodeURIComponent(scorer.name)}`)
            .then(res => res.json())
            .then(data => {
                if (data.photo) {
                    const img = document.getElementById(photoId);
                    if (img) img.src = data.photo;
                }
            })
            .catch(err => console.error('Photo fetch error:', err));

        return `
            <div class="scorer-card">
                <div class="scorer-rank ${rankClass}">${rank}</div>
                <div class="scorer-header">
                    <img src="${scorer.photo}" id="${photoId}" alt="${scorer.name}" class="scorer-photo" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(scorer.name)}&background=random&color=fff&size=128';">
                    <div class="scorer-info">
                        <div class="scorer-name">${scorer.name}</div>
                        <div class="scorer-team-container">
                            ${scorer.teamLogo ? `<img src="${scorer.teamLogo}" alt="${scorer.team}" class="scorer-team-logo-small" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(scorer.team)}&background=random&color=fff&size=32';">` : ''}
                            <span class="scorer-team">${scorer.team}</span>
                        </div>
                        <div class="scorer-nationality">${scorer.nationality} • ${scorer.position}</div>
                    </div>
                </div>
                <div class="scorer-stats">
                    <div class="scorer-stat">
                        <span class="scorer-stat-value">${scorer.goals}</span>
                        <span class="scorer-stat-label">Goals</span>
                    </div>
                    <div class="scorer-stat">
                        <span class="scorer-stat-value">${scorer.assists}</span>
                        <span class="scorer-stat-label">Assists</span>
                    </div>
                    <div class="scorer-stat">
                        <span class="scorer-stat-value">${scorer.matches}</span>
                        <span class="scorer-stat-label">Games</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function init() {
    console.log('🚀 Scorers page initializing...');

    // Main data fetch
    fetchScorers().then(scorers => {
        renderScorers(scorers);
        console.log('✅ Scorers data loaded!');
    }).catch(err => {
        console.error('Scorers failed to load:', err);
    });
}

document.addEventListener('DOMContentLoaded', init);
