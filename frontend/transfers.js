/**
 * La Liga Hub - Transfers Page JavaScript
 */

const API_BASE_URL = '/api';

let allTransfers = [];

// Mobile nav toggle
document.getElementById('navToggle')?.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('active');
});

async function fetchTransfers() {
    try {
        const response = await fetch(`${API_BASE_URL}/transfers`);
        if (!response.ok) throw new Error('Failed to fetch transfers');
        return await response.json();
    } catch (error) {
        console.error('Error fetching transfers:', error);
        return null;
    }
}

function renderTransfers(transfers) {
    const container = document.getElementById('transfersGrid');

    if (!transfers || transfers.length === 0) {
        container.innerHTML = '<div class="loading-spinner"><span>No transfers available</span></div>';
        return;
    }

    const typeLabels = {
        in: { label: 'Signing', class: 'transfer-in', icon: '➡️' },
        out: { label: 'Departure', class: 'transfer-out', icon: '⬅️' },
        loan: { label: 'Loan', class: 'transfer-loan', icon: '🔄' },
        extension: { label: 'Extension', class: 'transfer-extension', icon: '✍️' }
    };

    container.innerHTML = transfers.map(transfer => {
        const typeInfo = typeLabels[transfer.type] || { label: 'Transfer', class: '', icon: '🔄' };

        return `
            <div class="transfer-card ${typeInfo.class}">
                <div class="transfer-header">
                    <span class="transfer-badge">${typeInfo.icon} ${typeInfo.label}</span>
                    <span class="transfer-date">${formatDate(transfer.date)}</span>
                </div>
                <div class="transfer-player">
                    <span class="transfer-flag">${transfer.image}</span>
                    <span class="transfer-name">${transfer.player}</span>
                </div>
                <div class="transfer-clubs">
                    <div class="transfer-from">
                        <span class="club-label">From</span>
                        <span class="club-name">${transfer.fromTeam}</span>
                    </div>
                    <span class="transfer-arrow">→</span>
                    <div class="transfer-to">
                        <span class="club-label">To</span>
                        <span class="club-name">${transfer.toTeam}</span>
                    </div>
                </div>
                <div class="transfer-fee-badge">${transfer.fee}</div>
            </div>
        `;
    }).join('');
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

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter transfers
            const filter = btn.dataset.filter;
            if (filter === 'all') {
                renderTransfers(allTransfers);
            } else {
                const filtered = allTransfers.filter(t => t.type === filter);
                renderTransfers(filtered);
            }
        });
    });
}

async function init() {
    console.log('🚀 Transfers page initializing...');

    // Main data fetch
    fetchTransfers().then(transfers => {
        allTransfers = transfers || [];
        renderTransfers(allTransfers);
        setupFilters();
        console.log('✅ Transfers data loaded!');
    }).catch(err => {
        console.error('Transfers failed to load:', err);
    });

    // Independent news fetch
    fetchLatestNews().then(news => {
        renderMiniNews(news);
        console.log('✅ News grid loaded!');
    });
}

document.addEventListener('DOMContentLoaded', init);
