/**
 * La Liga Hub - News Page JavaScript
 */

const API_BASE_URL = '/api';

// Mobile nav toggle
document.getElementById('navToggle')?.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('active');
});

/**
 * Format Date Helper
 */
function formatDate(dateString) {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Fetch All News
 */
async function fetchAllNews(category = 'all') {
    try {
        const response = await fetch(`${API_BASE_URL}/news?category=${category}`);
        if (!response.ok) throw new Error('Failed to fetch news');
        return await response.json();
    } catch (error) {
        console.error('Error fetching news:', error);
        return [];
    }
}

/**
 * Render Page
 */
async function renderPage() {
    const newsData = await fetchAllNews();

    // 1. Render Featured (First Item)
    const featuredContainer = document.getElementById('featuredNews');
    if (newsData.length > 0) {
        const featured = newsData[0];
        featuredContainer.innerHTML = `
            <div class="featured-card">
                <div class="featured-img-container">
                    <img src="${featured.image}" alt="${featured.title}" class="featured-img" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1579952363873-27f3bde9be2e?auto=format&fit=crop&q=80&w=800';">
                </div>
                <div class="featured-content">
                    <span class="news-category cat-${featured.category}">${featured.category}</span>
                    <h2 class="featured-title">${featured.title}</h2>
                    <p class="featured-summary">${featured.content}</p> <!--< Using full content/summary for featured -->
                    <div class="featured-meta">
                        <span>${formatDate(featured.date)}</span>
                        <span>•</span>
                        <span>${featured.author || 'La Liga Hub'}</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        featuredContainer.innerHTML = '';
    }

    // 2. Render Grid (Remaining Items)
    const gridContainer = document.getElementById('newsGrid');
    const gridItems = newsData.slice(1);

    if (gridItems.length === 0) {
        gridContainer.innerHTML = '<p>No additional news available.</p>';
    } else {
        gridContainer.innerHTML = gridItems.map(item => `
            <div class="news-grid-item">
                <div class="grid-img-container">
                    ${item.image.length > 3 ? `<img src="${item.image}" alt="${item.title}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1579952363873-27f3bde9be2e?auto=format&fit=crop&q=80&w=800';">` : '<span class="news-icon">📰</span>'}
                </div>
                <div class="grid-content">
                    <span class="news-category cat-${item.category}">${item.category}</span>
                    <h3 class="grid-title">${item.title}</h3>
                    <p class="grid-summary">${item.summary}</p>
                    <span class="news-date">${formatDate(item.date)}</span>
                </div>
            </div>
        `).join('');
    }
}

/**
 * Render Filters
 */
function renderFilters(categories) {
    const container = document.getElementById('newsFilters');
    if (!container) return;

    // Default 'All'
    container.innerHTML = categories.map(cat => `
        <span class="filter-chip ${cat === 'All' ? 'active' : ''}" data-category="${cat.toLowerCase()}">${cat}</span>
    `).join('');

    // Click Events
    container.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', async () => {
            // UI Toggle
            container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // Fetch & Re-render Grid ONLY (Keep featured static or update? Let's update all for now)
            const category = chip.dataset.category;
            const filteredNews = await fetchAllNews(category);

            // Re-render everything with filtered data
            // NOTE: Logic allows duplicate rendering code, strictly we should refactor renderPage to accept data
            // But reuse renderPage() logic manually for simplicity:

            const gridContainer = document.getElementById('newsGrid');
            const featuredContainer = document.getElementById('featuredNews');

            if (filteredNews.length > 0) {
                // If filtering, maybe we don't show a giant featured one? 
                // Or just show the first one as featured. Let's do first as featured.
                const featured = filteredNews[0];
                featuredContainer.innerHTML = `
                    <div class="featured-card">
                        <div class="featured-img-container">
                            <img src="${featured.image}" alt="${featured.title}" class="featured-img" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1579952363873-27f3bde9be2e?auto=format&fit=crop&q=80&w=800';">
                        </div>
                        <div class="featured-content">
                            <span class="news-category cat-${featured.category}">${featured.category}</span>
                            <h2 class="featured-title">${featured.title}</h2>
                            <p class="featured-summary">${featured.content}</p>
                            <div class="featured-meta">
                                <span>${formatDate(featured.date)}</span>
                                <span>•</span>
                                <span>${featured.author || 'La Liga Hub'}</span>
                            </div>
                        </div>
                    </div>
                `;

                const gridItems = filteredNews.slice(1);
                gridContainer.innerHTML = gridItems.map(item => `
                    <div class="news-grid-item">
                        <div class="grid-img-container">
                            ${item.image.length > 3 ? `<img src="${item.image}" alt="${item.title}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1579952363873-27f3bde9be2e?auto=format&fit=crop&q=80&w=800';">` : '<span class="news-icon">📰</span>'}
                        </div>
                        <div class="grid-content">
                            <span class="news-category cat-${item.category}">${item.category}</span>
                            <h3 class="grid-title">${item.title}</h3>
                            <p class="grid-summary">${item.summary}</p>
                            <span class="news-date">${formatDate(item.date)}</span>
                        </div>
                    </div>
                `).join('');

            } else {
                featuredContainer.innerHTML = '';
                gridContainer.innerHTML = '<p class="no-data">No news found for this category.</p>';
            }
        });
    });
}

/**
 * Handle subscription (Reused logic)
 */
function setupSubscription() {
    const form = document.getElementById('newsletterForm');
    const message = document.getElementById('subscriptionMessage');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('subscriberEmail').value;

        try {
            const response = await fetch(`${API_BASE_URL}/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();

            if (data.success) {
                message.style.color = '#4cd964';
                message.textContent = data.message;
                form.reset();
            } else {
                message.style.color = '#ff3b30';
                message.textContent = data.error || 'Something went wrong.';
            }
        } catch (e) {
            message.textContent = 'Connection error. Try again later.';
        }
    });
}

// Init
async function init() {
    await renderPage();

    // Load categories
    fetch(`${API_BASE_URL}/news/categories`)
        .then(res => res.json())
        .then(categories => renderFilters(categories));

    setupSubscription();
}

document.addEventListener('DOMContentLoaded', init);
