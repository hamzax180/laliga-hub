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
 * Schedules a check for matches in the Barcelona timezone.
 * Also catches up if the user opens the page after 2 PM.
 */
function setupDailyNotifications() {
    console.log('⏰ Scheduling daily match alerts (2 PM Barcelona Time)...');

    const getBarcelonaTime = () => {
        const options = { timeZone: 'Europe/Madrid', hour: 'numeric', minute: 'numeric', hour12: false };
        const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(new Date());
        const hour = parseInt(parts.find(p => p.type === 'hour').value);
        const minute = parseInt(parts.find(p => p.type === 'minute').value);
        return { hour, minute };
    };

    const getTodayStr = () => {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
    };

    const trySendDailyAlert = () => {
        const todayStr = getTodayStr();
        if (localStorage.getItem('lastDailyAlert') !== todayStr) {
            console.log('📢 Sending daily match alert for', todayStr);
            fetchDailyMatchesAndNotify();
            localStorage.setItem('lastDailyAlert', todayStr);
        }
    };

    const checkTime = () => {
        const { hour, minute } = getBarcelonaTime();

        // Trigger at 2 PM Barcelona time (14:00 - 14:01 window)
        if (hour === 14 && minute <= 1) {
            trySendDailyAlert();
        }
    };

    // Catch-up: if the user opens the page AFTER 2 PM, still send today's alert
    const catchUp = () => {
        const { hour } = getBarcelonaTime();
        if (hour >= 14) {
            console.log('⏰ Catch-up check: it is past 2 PM Barcelona time');
            trySendDailyAlert();
        }
    };

    // Run catch-up immediately on load
    catchUp();

    // Then check every 30 seconds for the exact 2 PM window
    setInterval(checkTime, 30000);
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
            console.log('✅ Matchday notification sent:', matchNames);
        } else {
            sendSystemNotification("La Liga Hub ⚽", {
                body: "No La Liga matches scheduled today. Check back tomorrow!",
                tag: 'matchday-alert'
            });
            console.log('ℹ️ No matches today, sent info notification');
        }
    } catch (e) {
        console.error("❌ Daily match check failed:", e);
    }
}

// Global expose
window.sendSystemNotification = sendSystemNotification;
window.setupDailyNotifications = setupDailyNotifications;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.setupDailyNotifications();
});
