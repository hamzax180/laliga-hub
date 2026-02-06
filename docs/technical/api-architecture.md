# 🔌 API Architecture

The La Liga Hub backend is a high-performance Express.js server designed for reliability and data availability.

## Core Design
- **RESTful API**: Clean separation of concerns with dedicated endpoints for standings, news, scorers, and fixtures.
- **Dual-Data Strategy**:
  - **Live Path**: Fetches from external Football Data APIs.
  - **Fallback Path**: Uses local JSON mocks if the external API is unreachable or hits rate limits.
- **In-Memory Caching**: Implements a global cache object with a 5-minute TTL (Time To Live) to reduce external API requests and improve response latency.

## Key Endpoints
- `/api/standings`: Returns current league table.
- `/api/news`: Combines live news or mocks with "Smart Image" Unsplash matching.
- `/api/subscribe`: Handles async email processing via Brevo.
