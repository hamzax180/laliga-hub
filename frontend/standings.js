/**
 * La Liga Hub - Standings Page JavaScript
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

// Mobile nav toggle
document.getElementById('navToggle')?.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('active');
});

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

function renderStandings(teams) {
    const container = document.getElementById('standingsBody');

    if (!teams || teams.length === 0) {
        container.innerHTML = '<div class="loading-spinner"><span>No data available</span></div>';
        return;
    }

    container.innerHTML = teams.map((team, index) => {
        const position = index + 1;
        let rowClass = '';
        let posClass = '';

        if (position <= 4) { rowClass = 'champions'; posClass = 'top'; }
        else if (position <= 6) { rowClass = 'europa'; }
        else if (position >= 18) { rowClass = 'relegation'; }

        const logoContent = team.logo
            ? `<img src="${team.logo}" alt="${team.name}" class="team-logo-img">`
            : (teamEmojis[team.name] || '⚽');

        return `
            <div class="team-row ${rowClass}">
                <span class="position ${posClass}">${position}</span>
                <div class="team-info">
                    <div class="team-logo">${logoContent}</div>
                    <span class="team-name">${team.name}</span>
                </div>
                <span class="col-stat">${team.played}</span>
                <span class="col-stat">${team.won}</span>
                <span class="col-stat">${team.drawn}</span>
                <span class="col-stat">${team.lost}</span>
                <span class="col-stat">${team.goalsFor}</span>
                <span class="col-stat">${team.goalsAgainst}</span>
                <span class="col-stat">${team.goalDifference > 0 ? '+' : ''}${team.goalDifference}</span>
                <span class="col-pts">${team.points}</span>
            </div>
        `;
    }).join('');
}

async function init() {
    console.log('🚀 Standings page initializing...');
    const teams = await fetchTeams();
    renderStandings(teams);
    console.log('✅ Standings loaded!');
}

document.addEventListener('DOMContentLoaded', init);
