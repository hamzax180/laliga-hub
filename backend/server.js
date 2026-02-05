const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FOOTBALL_API_KEY ? process.env.FOOTBALL_API_KEY.trim() : null;
const COMPETITION = 'PD'; // La Liga Primera Division

// Middleware
app.use(cors());
app.use(express.json());

// Load fallback mock data
const mockTeams = require('./data/teams.json');
const mockScorers = require('./data/scorers.json');
const mockFixtures = require('./data/fixtures.json');
const mockNews = require('./data/news.json');
const mockTransfers = require('./data/transfers.json');

// Football-Data.org Client
const footballApi = axios.create({
    baseURL: 'https://api.football-data.org/v4',
    headers: {
        'X-Auth-Token': API_KEY
    }
});

// ============================================
// Data Mapping Helpers (Football-Data.org v4)
// ============================================

const mapStandings = (apiData) => {
    if (!apiData || !apiData.standings || !apiData.standings[0]) return mockTeams;
    const table = apiData.standings[0].table;
    return table.map(entry => ({
        id: entry.team.id,
        name: entry.team.shortName || entry.team.name,
        logo: entry.team.crest,
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

const mapScorers = (apiData) => {
    if (!apiData || !apiData.scorers) return mockScorers;
    return apiData.scorers.map((item) => ({
        id: item.player.id,
        name: item.player.name,
        photo: null, // football-data.org doesn't provide player photos in free tier
        team: item.team.name,
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
        stadium: null // Not always provided
    }));
};

// ============================================
// API Routes
// ============================================

app.get('/api/teams', async (req, res) => {
    try {
        if (API_KEY) {
            const response = await footballApi.get(`/competitions/${COMPETITION}/standings`);
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
            const response = await footballApi.get(`/competitions/${COMPETITION}/scorers`);
            return res.json(mapScorers(response.data));
        }
        res.json(mockScorers);
    } catch (error) {
        console.error('Live API Error (Scorers):', error.message);
        res.json(mockScorers);
    }
});

app.get('/api/fixtures', async (req, res) => {
    try {
        if (API_KEY) {
            const response = await footballApi.get(`/competitions/${COMPETITION}/matches`);
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
                footballApi.get(`/competitions/${COMPETITION}/standings`),
                footballApi.get(`/competitions/${COMPETITION}/scorers`),
                footballApi.get(`/competitions/${COMPETITION}/matches`, { params: { status: 'SCHEDULED', limit: 3 } })
            ]);

            if (standingsRes.status === 'fulfilled') teamsArr = mapStandings(standingsRes.value.data);
            if (scorersRes.status === 'fulfilled') scorersArr = mapScorers(scorersRes.value.data);
            if (fixturesRes.status === 'fulfilled') fixturesArr = mapFixtures(fixturesRes.value.data);
        }

        res.json({
            topTeams: teamsArr.slice(0, 5),
            topScorers: scorersArr.slice(0, 3),
            nextFixtures: fixturesArr.slice(0, 3),
            latestNews: mockNews.slice(0, 3),
            latestTransfers: mockTransfers.slice(0, 3),
            stats: { totalMatches: 220, totalGoals: 583, avgGoalsPerMatch: 2.65 }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        provider: 'football-data.org',
        live: !!API_KEY
    });
});

app.get('/api/debug-scorers', async (req, res) => {
    try {
        if (API_KEY) {
            const response = await footballApi.get(`/competitions/${COMPETITION}/scorers`);
            return res.json({ status: response.status, data: response.data });
        }
        res.json({ error: 'No API Key' });
    } catch (error) {
        res.status(500).json({ error: error.message, apiResponse: error.response ? error.response.data : null });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} (Live Mode: ${!!API_KEY})`);
});

module.exports = app;
