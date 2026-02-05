const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FOOTBALL_API_KEY;
const LEAGUE_ID = 140; // La Liga
const SEASON = 2025; // Current season

// Middleware
app.use(cors());
app.use(express.json());

// Load fallback mock data
const mockTeams = require('./data/teams.json');
const mockScorers = require('./data/scorers.json');
const mockFixtures = require('./data/fixtures.json');
const mockNews = require('./data/news.json');
const mockTransfers = require('./data/transfers.json');

// API-Football Client
const footballApi = axios.create({
    baseURL: 'https://api-football-v1.p.rapidapi.com/v3',
    headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
    }
});

// ============================================
// Data Mapping Helpers
// ============================================

const mapStandings = (apiData) => {
    if (!apiData || !apiData.response || !apiData.response[0]) return mockTeams;
    const standings = apiData.response[0].league.standings[0];
    return standings.map(team => ({
        id: team.team.id,
        name: team.team.name,
        logo: team.team.logo,
        played: team.all.played,
        won: team.all.win,
        drawn: team.all.draw,
        lost: team.all.lose,
        goalsFor: team.all.goals.for,
        goalsAgainst: team.all.goals.against,
        goalDifference: team.goalsDiff,
        points: team.points,
        form: team.form
    }));
};

const mapScorers = (apiData) => {
    if (!apiData || !apiData.response) return mockScorers;
    return apiData.response.map((item, index) => ({
        id: item.player.id,
        name: item.player.name,
        photo: item.player.photo,
        team: item.statistics[0].team.name,
        nationality: item.player.nationality,
        position: item.statistics[0].games.position,
        goals: item.statistics[0].goals.total,
        assists: item.statistics[0].goals.assists || 0,
        matches: item.statistics[0].games.appearences,
        minutesPlayed: item.statistics[0].games.minutes
    }));
};

const mapFixtures = (apiData) => {
    if (!apiData || !apiData.response) return mockFixtures;
    return apiData.response.map(item => ({
        id: item.fixture.id,
        date: item.fixture.date.split('T')[0],
        time: item.fixture.date.split('T')[1].substring(0, 5),
        homeTeam: item.teams.home.name,
        homeLogo: item.teams.home.logo,
        awayTeam: item.teams.away.name,
        awayLogo: item.teams.away.logo,
        homeGoals: item.goals.home,
        awayGoals: item.goals.away,
        status: item.fixture.status.short,
        matchday: parseInt(item.league.round.replace(/[^0-9]/g, ''))
    }));
};

// ============================================
// API Routes
// ============================================

app.get('/api/teams', async (req, res) => {
    try {
        if (API_KEY) {
            const response = await footballApi.get('/standings', {
                params: { league: LEAGUE_ID, season: SEASON }
            });
            return res.json(mapStandings(response.data));
        }
        res.json(mockTeams);
    } catch (error) {
        console.error('Live API Error (Teams):', error.message);
        res.json(mockTeams);
    }
});

app.get('/api/scorers', async (req, res) => {
    try {
        if (API_KEY) {
            const response = await footballApi.get('/players/topscorers', {
                params: { league: LEAGUE_ID, season: SEASON }
            });
            return res.json(mapScorers(response.data));
        }
        res.json(mockScorers);
    } catch (error) {
        console.error('Live API Error (Scorers):', error.message);
        res.status(500).json({
            error: 'Live API Failed',
            details: error.message,
            fallback: mockScorers
        });
    }
});

app.get('/api/fixtures', async (req, res) => {
    try {
        if (API_KEY) {
            const response = await footballApi.get('/fixtures', {
                params: { league: LEAGUE_ID, season: SEASON }
            });
            return res.json(mapFixtures(response.data));
        }
        res.json(mockFixtures);
    } catch (error) {
        console.error('Live API Error (Fixtures):', error.message);
        res.json(mockFixtures);
    }
});

app.get('/api/news', (req, res) => res.json(mockNews));
app.get('/api/transfers', (req, res) => res.json(mockTransfers));

app.get('/api/dashboard', async (req, res) => {
    try {
        let teamsArr = mockTeams;
        let scorersArr = mockScorers;
        let fixturesArr = mockFixtures;

        if (API_KEY) {
            const [standingsRes, scorersRes, fixturesRes] = await Promise.allSettled([
                footballApi.get('/standings', { params: { league: LEAGUE_ID, season: SEASON } }),
                footballApi.get('/players/topscorers', { params: { league: LEAGUE_ID, season: SEASON } }),
                footballApi.get('/fixtures', { params: { league: LEAGUE_ID, season: SEASON, next: 10 } })
            ]);

            if (standingsRes.status === 'fulfilled') teamsArr = mapStandings(standingsRes.value.data);
            if (scorersRes.status === 'fulfilled') scorersArr = mapScorers(scorersRes.value.data);
            if (fixturesRes.status === 'fulfilled') fixturesArr = mapFixtures(fixturesRes.value.data);
        }

        res.json({
            topTeams: teamsArr.slice(0, 5),
            topScorers: scorersArr.slice(0, 3),
            nextFixtures: fixturesArr.filter(f => f.status === 'NS').slice(0, 3),
            latestNews: mockNews.slice(0, 3),
            latestTransfers: mockTransfers.slice(0, 3),
            stats: { totalMatches: 220, totalGoals: 583, avgGoalsPerMatch: 2.65 }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', live: !!API_KEY, keyPrefix: API_KEY ? API_KEY.substring(0, 4) : 'none' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} (Live Mode: ${!!API_KEY})`);
});

module.exports = app;
