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

        return `
            <div class="scorer-card">
                <div class="scorer-rank ${rankClass}">${rank}</div>
                ${scorer.photo ? `<img src="${scorer.photo}" alt="${scorer.name}" class="scorer-photo">` : ''}
                <div class="scorer-info">
                    <div class="scorer-name">${scorer.name}</div>
                    <div class="scorer-team">${scorer.team}</div>
                    <div class="scorer-nationality">${scorer.nationality} • ${scorer.position}</div>
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
    const scorers = await fetchScorers();
    renderScorers(scorers);
    console.log('✅ Scorers loaded!');
}

document.addEventListener('DOMContentLoaded', init);
