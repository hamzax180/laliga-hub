/**
 * La Liga Hub - Notifications & Alerts
 */

/**
 * SYSTEM NOTIFICATIONS
 * Shows a native OS-level notification
 */
async function sendSystemNotification(title, options = {}) {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return;
    }

    if (Notification.permission === "granted") {
        new Notification(title, {
            icon: 'https://cdn-icons-png.flaticon.com/512/53/53283.png',
            ...options
        });
    } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            sendSystemNotification(title, options);
        }
    }
}

/**
 * DAILY MATCH ALERTS (2 PM Barcelona Time)
 * Schedules a check for matches in the Barcelona timezone
 */
function setupDailyNotifications() {
    console.log('⏰ Scheduling daily match alerts (2 PM Barcelona Time)...');

    const checkTime = () => {
        const options = { timeZone: 'Europe/Madrid', hour: 'numeric', minute: 'numeric', hour12: false };
        const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(new Date());
        const hour = parseInt(parts.find(p => p.type === 'hour').value);
        const minute = parseInt(parts.find(p => p.type === 'minute').value);

        // 2 PM in Barcelona
        if (hour === 14 && minute === 0) {
            const todayStr = new Date().toLocaleDateString('en-CA');
            if (localStorage.getItem('lastDailyAlert') !== todayStr) {
                fetchDailyMatchesAndNotify();
                localStorage.setItem('lastDailyAlert', todayStr);
            }
        }
    };

    // Check every 30 seconds to be precise
    setInterval(checkTime, 30000);
    checkTime();
}

/**
 * Fetch matches from API and send notification
 */
async function fetchDailyMatchesAndNotify() {
    try {
        const res = await fetch('/api/matches/today');
        const matches = await res.json();

        if (matches && matches.length > 0) {
            const matchNames = matches.map(m => `${m.homeTeam} vs ${m.awayTeam}`).join(', ');
            sendSystemNotification("La Liga Matchday! ⚽", {
                body: `Today's fixtures: ${matchNames}. Don't miss the action!`,
                tag: 'matchday-alert'
            });
        }
    } catch (e) {
        console.error("Daily match check failed", e);
    }
}

// Global expose
window.sendSystemNotification = sendSystemNotification;
window.setupDailyNotifications = setupDailyNotifications;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.setupDailyNotifications();
});
