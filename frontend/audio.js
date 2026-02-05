/**
 * AUDIO UTILITIES FOR LA LIGA HUB
 */

/**
 * Stadium Mode Audio
 * Handles the background anthem and stadium sounds.
 */
function setupStadiumMode() {
    const toggle = document.getElementById('soundToggle');
    const audio = document.getElementById('stadiumAudio');
    const icon = toggle?.querySelector('.sound-icon');

    if (!toggle || !audio) return;

    // Check if user previously had it active
    const wasActive = localStorage.getItem('stadiumMode') === 'true';
    if (wasActive) {
        toggle.classList.add('active');
        if (icon) icon.textContent = '🔊';
    }

    toggle.addEventListener('click', () => {
        // Use current playback state to determine action
        if (audio.paused) {
            audio.play().then(() => {
                toggle.classList.add('active');
                if (icon) icon.textContent = '🔊';
                localStorage.setItem('stadiumMode', 'true');

                // Fade in volume for premium feel
                audio.volume = 0;
                let volume = 0;
                const fade = setInterval(() => {
                    if (volume < 0.4) {
                        volume += 0.05;
                        audio.volume = volume;
                    } else {
                        clearInterval(fade);
                    }
                }, 100);
            }).catch(err => {
                console.warn('Audio play failed:', err);
                // Reset UI state on error (usually browser block)
                toggle.classList.remove('active');
                if (icon) icon.textContent = '🔈';
                alert('Please click anywhere on the page first, then try the Stadium Mode button again!');
            });
        } else {
            audio.pause();
            toggle.classList.remove('active');
            if (icon) icon.textContent = '🔈';
            localStorage.setItem('stadiumMode', 'false');
        }
    });

    // Handle audio error just in case URL is dead
    audio.addEventListener('error', () => {
        console.error('Stadium audio source failed to load.');
        toggle.style.display = 'none'; // Hide if broken
    });
}

/**
 * Global Initialization
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setupStadiumMode };
}
