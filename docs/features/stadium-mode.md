# 🏟️ Stadium Mode

Stadium Mode is a signature immersive feature of La Liga Hub that synchronizes audio atmosphere with the user's dashboard experience.

## Technical Workflow
1. **Audio Sources**: 
   - **Anthem**: The primary theme song.
   - **Fans**: Ambient crowd noise/cheering.
2. **Synchronization**: Both tracks are initialized simultaneously with synchronized fade-in and fade-out effects to create a seamless transition.
3. **Persistence**: The state (ON/OFF) is stored in `localStorage` under the key `stadiumMode`. This ensures the atmosphere remains consistent as the user navigates between pages.
4. **Browser Restrictions**: Due to auto-play policies, the audio starts in a "muted" or "paused" state on first visit. A user interaction (clicking the toggle) is required to unlock playback.

## Implementation Details
- Located in `frontend/audio.js`.
- Uses CSS classes (`active`) and text content changes (🔈, 🔊) for visual feedback.
