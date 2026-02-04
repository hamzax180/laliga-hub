/**
 * La Liga Hub - Backend API Server
 * Express server providing REST API for La Liga data
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Load mock data
const teams = require('./data/teams.json');
const scorers = require('./data/scorers.json');
const fixtures = require('./data/fixtures.json');
const news = require('./data/news.json');
const transfers = require('./data/transfers.json');

// League statistics (calculated from data)
const stats = {
    totalMatches: 220,
    totalGoals: 583,
    avgGoalsPerMatch: 2.65,
    cleanSheets: 87,
    yellowCards: 892,
    redCards: 34
};

// ============================================
// API Routes
// ============================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'laliga-backend'
    });
});

/**
 * Get all teams with standings
 * GET /api/teams
 */
app.get('/api/teams', (req, res) => {
    try {
        // Sort by points (descending), then goal difference
        const sortedTeams = [...teams].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.goalDifference - a.goalDifference;
        });

        res.json(sortedTeams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

/**
 * Get single team by ID
 * GET /api/teams/:id
 */
app.get('/api/teams/:id', (req, res) => {
    try {
        const team = teams.find(t => t.id === parseInt(req.params.id));
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        res.json(team);
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

/**
 * Get top scorers
 * GET /api/scorers
 */
app.get('/api/scorers', (req, res) => {
    try {
        // Sort by goals (descending)
        const sortedScorers = [...scorers].sort((a, b) => {
            if (b.goals !== a.goals) return b.goals - a.goals;
            return b.assists - a.assists;
        });

        res.json(sortedScorers);
    } catch (error) {
        console.error('Error fetching scorers:', error);
        res.status(500).json({ error: 'Failed to fetch scorers' });
    }
});

/**
 * Get single scorer by ID
 * GET /api/scorers/:id
 */
app.get('/api/scorers/:id', (req, res) => {
    try {
        const scorer = scorers.find(s => s.id === parseInt(req.params.id));
        if (!scorer) {
            return res.status(404).json({ error: 'Scorer not found' });
        }
        res.json(scorer);
    } catch (error) {
        console.error('Error fetching scorer:', error);
        res.status(500).json({ error: 'Failed to fetch scorer' });
    }
});

/**
 * Get league statistics
 * GET /api/stats
 */
app.get('/api/stats', (req, res) => {
    try {
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * Get all fixtures
 * GET /api/fixtures
 */
app.get('/api/fixtures', (req, res) => {
    try {
        // Sort by date
        const sortedFixtures = [...fixtures].sort((a, b) => {
            return new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time);
        });
        res.json(sortedFixtures);
    } catch (error) {
        console.error('Error fetching fixtures:', error);
        res.status(500).json({ error: 'Failed to fetch fixtures' });
    }
});

/**
 * Get fixtures by matchday
 * GET /api/fixtures/matchday/:matchday
 */
app.get('/api/fixtures/matchday/:matchday', (req, res) => {
    try {
        const matchday = parseInt(req.params.matchday);
        const matchdayFixtures = fixtures.filter(f => f.matchday === matchday);
        res.json(matchdayFixtures);
    } catch (error) {
        console.error('Error fetching matchday fixtures:', error);
        res.status(500).json({ error: 'Failed to fetch matchday fixtures' });
    }
});

/**
 * Get fixtures for a specific team
 * GET /api/fixtures/team/:teamName
 */
app.get('/api/fixtures/team/:teamName', (req, res) => {
    try {
        const teamName = decodeURIComponent(req.params.teamName).toLowerCase();
        const teamFixtures = fixtures.filter(f =>
            f.homeTeam.toLowerCase().includes(teamName) ||
            f.awayTeam.toLowerCase().includes(teamName)
        );

        // Sort by date
        teamFixtures.sort((a, b) => {
            return new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time);
        });

        res.json(teamFixtures);
    } catch (error) {
        console.error('Error fetching team fixtures:', error);
        res.status(500).json({ error: 'Failed to fetch team fixtures' });
    }
});

/**
 * Get calendar view grouped by date
 * GET /api/calendar
 */
app.get('/api/calendar', (req, res) => {
    try {
        // Group fixtures by date
        const calendar = {};
        fixtures.forEach(fixture => {
            if (!calendar[fixture.date]) {
                calendar[fixture.date] = [];
            }
            calendar[fixture.date].push(fixture);
        });

        // Sort matches within each day by time
        Object.keys(calendar).forEach(date => {
            calendar[date].sort((a, b) => a.time.localeCompare(b.time));
        });

        // Convert to array and sort by date
        const sortedCalendar = Object.entries(calendar)
            .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
            .map(([date, matches]) => ({
                date,
                dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
                matches
            }));

        res.json(sortedCalendar);
    } catch (error) {
        console.error('Error fetching calendar:', error);
        res.status(500).json({ error: 'Failed to fetch calendar' });
    }
});

/**
 * Get recent news
 * GET /api/news
 */
app.get('/api/news', (req, res) => {
    try {
        // Sort by date (most recent first)
        const sortedNews = [...news].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );
        res.json(sortedNews);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

/**
 * Get all transfers
 * GET /api/transfers
 */
app.get('/api/transfers', (req, res) => {
    try {
        // Sort by date (most recent first)
        const sortedTransfers = [...transfers].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );
        res.json(sortedTransfers);
    } catch (error) {
        console.error('Error fetching transfers:', error);
        res.status(500).json({ error: 'Failed to fetch transfers' });
    }
});

/**
 * Get transfers by type (in, out, loan, extension)
 * GET /api/transfers/type/:type
 */
app.get('/api/transfers/type/:type', (req, res) => {
    try {
        const type = req.params.type.toLowerCase();
        const filteredTransfers = transfers.filter(t => t.type === type);
        res.json(filteredTransfers);
    } catch (error) {
        console.error('Error fetching transfers by type:', error);
        res.status(500).json({ error: 'Failed to fetch transfers' });
    }
});

/**
 * Get dashboard summary for home page
 * GET /api/dashboard
 */
app.get('/api/dashboard', (req, res) => {
    try {
        // Get top 5 teams
        const topTeams = [...teams]
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);

        // Get top 3 scorers
        const topScorers = [...scorers]
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 3);

        // Get next 3 fixtures
        const nextFixtures = [...fixtures]
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);

        // Get latest 3 news
        const latestNews = [...news]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);

        // Get latest 3 transfers
        const latestTransfers = [...transfers]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);

        res.json({
            topTeams,
            topScorers,
            nextFixtures,
            latestNews,
            latestTransfers,
            stats
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

/**
 * API info endpoint
 * GET /api
 */
app.get('/api', (req, res) => {
    res.json({
        name: 'La Liga Hub API',
        version: '2.0.0',
        endpoints: {
            health: 'GET /health',
            dashboard: 'GET /api/dashboard',
            teams: 'GET /api/teams',
            team: 'GET /api/teams/:id',
            scorers: 'GET /api/scorers',
            scorer: 'GET /api/scorers/:id',
            stats: 'GET /api/stats',
            fixtures: 'GET /api/fixtures',
            matchday: 'GET /api/fixtures/matchday/:matchday',
            teamFixtures: 'GET /api/fixtures/team/:teamName',
            calendar: 'GET /api/calendar',
            news: 'GET /api/news',
            transfers: 'GET /api/transfers',
            transfersByType: 'GET /api/transfers/type/:type'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ⚽ La Liga Hub Backend API
    ==========================
    🚀 Server running on port ${PORT}
    📊 Endpoints available:
       - GET /health
       - GET /api/teams
       - GET /api/scorers
       - GET /api/stats
    `);
});

module.exports = app;
