/**
 * AUDIO UTILITIES FOR LA LIGA HUB
 */

/**
 * Show a modern notification instead of browser alert
 */
function showNotification(msg) {
    const existing = document.querySelector('.audio-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'audio-toast';
    toast.innerHTML = `
        <span class="toast-icon">⚠️</span>
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
    const toggle = document.getElementById('soundToggle');
    const anthem = document.getElementById('stadiumAudio');
    const fans = document.getElementById('fansAudio');
    const icon = toggle?.querySelector('.sound-icon');

    if (!toggle || !anthem || !fans) return;

    // Reset volume to 0 initially
    anthem.volume = 0;
    fans.volume = 0;

    // Check if user previously had it active
    const wasActive = localStorage.getItem('stadiumMode') === 'true';
    if (wasActive) {
        toggle.classList.add('active');
        if (icon) icon.textContent = '🔊';
        // Try to prime the audio on first interaction
        const primeAudio = () => {
            if (localStorage.getItem('stadiumMode') === 'true' && anthem.paused) {
                // Not starting automatically to be safe, but ready
            }
            document.removeEventListener('click', primeAudio);
        };
        document.addEventListener('click', primeAudio);
    }

    toggle.addEventListener('click', async (e) => {
        e.stopPropagation();

        if (anthem.paused) {
            try {
                // Update UI immediately to show intent
                toggle.classList.add('active');
                if (icon) icon.textContent = '⌛';

                // Play both
                await Promise.all([anthem.play(), fans.play()]);

                if (icon) icon.textContent = '🔊';
                localStorage.setItem('stadiumMode', 'true');

                // Fade in volume
                let vol = 0;
                const fade = setInterval(() => {
                    if (vol < 0.4) {
                        vol += 0.05;
                        anthem.volume = vol;
                        fans.volume = vol * 0.7;
                    } else {
                        clearInterval(fade);
                    }
                }, 100);

            } catch (err) {
                console.warn('Audio play failed:', err);
                toggle.classList.remove('active');
                if (icon) icon.textContent = '🔈';
                showNotification('Click anywhere on the pitch first to unlock the stadium sounds!');
            }
        } else {
            // Fade out then pause
            let vol = anthem.volume;
            const fadeOut = setInterval(() => {
                if (vol > 0.05) {
                    vol -= 0.05;
                    anthem.volume = vol;
                    fans.volume = vol * 0.7;
                } else {
                    clearInterval(fadeOut);
                    anthem.pause();
                    fans.pause();
                    anthem.currentTime = 0;
                    fans.currentTime = 0;
                }
            }, 50);

            toggle.classList.remove('active');
            if (icon) icon.textContent = '🔈';
            localStorage.setItem('stadiumMode', 'false');
        }
    });

    // Handle source errors
    anthem.addEventListener('error', () => {
        console.error('Anthem failed to load');
        showNotification('Anthem source unavailable. Trying to reload...');
    });
}

// Initialize on load
if (typeof window !== 'undefined') {
    window.setupStadiumMode = setupStadiumMode;
}
