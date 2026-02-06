# 📧 Smart Subscriptions

The subscription system is designed with a premium user experience (UX) and reliable backend delivery.

## Frontend Intelligence
- **Smart Suggestions**: As users type their email, a modern "Glassmorphism" styled list suggests common domains (gmail.com, hotmail.com, etc.).
- **Validation**: Client-side regex checking ensures valid entry before submission.
- **Autofill Override**: Custom CSS (`main.css`) overrides the default browser yellow/blue autofill colors to match the Hub's dark theme.

## Backend Delivery
- **Brevo Integration**: Replaced legacy SMTP with direct HTTP POST requests to the Brevo (Sendinblue) API v3.
- **Reliability**: Direct API calls bypass common serverless/container SMTP blocking issues.

## Code Location
- Frontend UI: `frontend/home.js`
- Backend Logic: `backend/server.js` (Subscription endpoint)
