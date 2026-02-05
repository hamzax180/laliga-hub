/**
 * AUDIO & UTILS FOR LA LIGA HUB
 */

/**
 * Show a modern notification instead of browser alert
 */
function showNotification(msg, type = 'warning') {
    const existing = document.querySelector('.audio-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `audio-toast ${type}`;
    const icon = type === 'success' ? '✅' : '⚽';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${msg}</span>
    `;
    document.body.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

/**
 * Stadium Mode Audio
 * Handles the background anthem and stadium sounds.
 */
function setupStadiumMode() {
    console.log('🔈 Theme Song & Stadium Mode initializing...');
    const toggle = document.getElementById('soundToggle');
    const anthem = document.getElementById('stadiumAudio');
    const fans = document.getElementById('fansAudio');
    const icon = toggle?.querySelector('.sound-icon');

    if (!toggle || !anthem || !fans) {
        console.warn('❌ Theme song or sound elements missing!');
        return;
    }

    // Prepare audio for immediate response after interaction
    anthem.volume = 0;
    fans.volume = 0;

    // Check if user previously had it active and play if so
    const wasActive = localStorage.getItem('stadiumMode') === 'true';
    if (wasActive) {
        toggle.classList.add('active');
        if (icon) icon.textContent = '🔊';

        // Auto-play on page load if it was active
        window.addEventListener('load', async () => {
            try {
                await anthem.play();
                await fans.play().catch(() => { });
                anthem.volume = 0.4;
                fans.volume = 0.28;
            } catch (err) {
                console.log('🔇 Auto-play blocked by browser. User must click to resume.');
                toggle.classList.remove('active');
                if (icon) icon.textContent = '🔈';
            }
        });
    }

    toggle.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (anthem.paused) {
            try {
                toggle.classList.add('active');
                if (icon) icon.textContent = '⌛';

                await anthem.play();
                await fans.play().catch(e => console.warn('Fans playback failed'));

                if (icon) icon.textContent = '🔊';
                localStorage.setItem('stadiumMode', 'true');

                // Fade in
                let vol = 0;
                const fade = setInterval(() => {
                    vol += 0.05;
                    if (vol <= 0.4) {
                        anthem.volume = vol;
                        fans.volume = vol * 0.7;
                    } else {
                        clearInterval(fade);
                    }
                }, 100);

            } catch (err) {
                console.warn('❌ Anthem playback failed:', err);
                toggle.classList.remove('active');
                if (icon) icon.textContent = '🔈';
                showNotification('Click anywhere on the field first to unlock the stadium atmosphere! 🏟️');
            }
        } else {
            // Fade out
            let vol = anthem.volume;
            const fadeOut = setInterval(() => {
                vol -= 0.05;
                if (vol > 0) {
                    anthem.volume = vol;
                    fans.volume = vol * 0.7;
                } else {
                    clearInterval(fadeOut);
                    anthem.pause();
                    fans.pause();
                }
            }, 50);

            toggle.classList.remove('active');
            if (icon) icon.textContent = '🔈';
            localStorage.setItem('stadiumMode', 'false');
        }
    });
}

// Global expose
window.showNotification = showNotification;
window.setupStadiumMode = setupStadiumMode;
