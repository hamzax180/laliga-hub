# 🔔 Notifications & Alerts

La Liga Hub provides real-time and scheduled engagement through native browser notification systems.

## 1. System Notifications
- **Trigger**: Used for immediate feedback, such as a successful newsletter subscription or matchday welcome.
- **Implementation**: Uses the native `Notification` API with permission checking.
- **Assets**: Displays the custom La Liga Hub logo in the notification tray.

## 2. Daily Match Alerts
- **Schedule**: Executes daily at **2 PM Barcelona Time** (Europe/Madrid).
- **Timezone Logic**: Uses `Intl.DateTimeFormat` to resolve the current local time to Barcelona time, ensuring users worldwide receive the update at the same peak moment.
- **Data Fetching**: Calls the `/api/matches/today` endpoint to retrieve fixtures.
- **Scheduling**: Uses `setInterval` in `notifications.js` to poll and trigger once per day.

## Code Location
- `frontend/notifications.js`
