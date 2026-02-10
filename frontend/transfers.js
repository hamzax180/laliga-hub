/**
 * La Liga Hub - Transfers Page JavaScript
 * Shows confirmed transfers with player photos and team crests
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
        in: { label: 'Signing', class: 'transfer-in', color: '#30d158' },
        out: { label: 'Departure', class: 'transfer-out', color: '#ff453a' },
        loan: { label: 'Loan', class: 'transfer-loan', color: '#5856d6' },
        extension: { label: 'Extension', class: 'transfer-extension', color: '#ff9500' }
    };

    container.innerHTML = transfers.map(transfer => {
        const typeInfo = typeLabels[transfer.type] || { label: 'Transfer', class: '', color: '#888' };
        const playerPhoto = transfer.playerPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(transfer.player)}&background=1a1a2e&color=ff2d55&size=200&bold=true`;
        const fromCrest = transfer.fromCrest || '';
        const toCrest = transfer.toCrest || '';
        const position = transfer.position || '';
        const nationality = transfer.nationality || '⚽';

        return `
            <div class="transfer-card ${typeInfo.class}">
                <div class="transfer-type-ribbon" style="background: ${typeInfo.color}">
                    ${typeInfo.label}
                </div>
                <div class="transfer-card-body">
                    <div class="transfer-player-section">
                        <div class="transfer-player-photo-wrapper">
                            <img src="${playerPhoto}" alt="${transfer.player}" class="transfer-player-photo" 
                                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(transfer.player)}&background=1a1a2e&color=ff2d55&size=200&bold=true'">
                            <span class="transfer-nationality">${nationality}</span>
                        </div>
                        <div class="transfer-player-info">
                            <h3 class="transfer-player-name">${transfer.player}</h3>
                            ${transfer.headline ? `<span class="transfer-headline">${transfer.headline}</span>` : ''}
                            <span class="transfer-position">${position}</span>
                        </div>
                    </div>
                    <div class="transfer-clubs-section">
                        <div class="transfer-club">
                            ${fromCrest ? `<img src="${fromCrest}" alt="${transfer.fromTeam}" class="transfer-club-crest" onerror="this.style.display='none'">` : ''}
                            <div class="transfer-club-info">
                                <span class="transfer-club-label">FROM</span>
                                <span class="transfer-club-name">${transfer.fromTeam}</span>
                            </div>
                        </div>
                        <div class="transfer-direction-arrow">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="${typeInfo.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="transfer-club">
                            ${toCrest ? `<img src="${toCrest}" alt="${transfer.toTeam}" class="transfer-club-crest" onerror="this.style.display='none'">` : ''}
                            <div class="transfer-club-info">
                                <span class="transfer-club-label">TO</span>
                                <span class="transfer-club-name">${transfer.toTeam}</span>
                            </div>
                        </div>
                    </div>
                    <div class="transfer-footer">
                        <span class="transfer-fee-tag">${transfer.fee}</span>
                        <span class="transfer-date-tag">${formatDate(transfer.date)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

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

    fetchTransfers().then(transfers => {
        allTransfers = transfers || [];
        renderTransfers(allTransfers);
        setupFilters();
        setupStadiumMode();
        console.log('✅ Transfers data loaded!');
    }).catch(err => {
        console.error('Transfers failed to load:', err);
    });
}

document.addEventListener('DOMContentLoaded', init);
