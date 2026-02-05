/**
 * AUDIO UTILITIES FOR LA LIGA HUB
 */

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

    // Check if user previously had it active
    const wasActive = localStorage.getItem('stadiumMode') === 'true';
    if (wasActive) {
        toggle.classList.add('active');
        if (icon) icon.textContent = '🔊';
    }

    toggle.addEventListener('click', () => {
        // Use current playback state to determine action (checking anthem state)
        if (anthem.paused) {
            // Play both anthem and fans
            const playAnthem = anthem.play();
            const playFans = fans.play();

            Promise.all([playAnthem, playFans]).then(() => {
                toggle.classList.add('active');
                if (icon) icon.textContent = '🔊';
                localStorage.setItem('stadiumMode', 'true');

                // Fade in volume for premium feel
                anthem.volume = 0;
                fans.volume = 0;
                let volume = 0;
                const fade = setInterval(() => {
                    if (volume < 0.4) {
                        volume += 0.05;
                        anthem.volume = volume;
                        fans.volume = volume * 0.8; // Fans slightly quieter
                    } else {
                        clearInterval(fade);
                    }
                }, 100);
            }).catch(err => {
                console.warn('Audio play failed:', err);
                toggle.classList.remove('active');
                if (icon) icon.textContent = '🔈';
                alert('Please click anywhere on the page first, then try the Stadium Mode button again!');
            });
        } else {
            // Pause both
            anthem.pause();
            fans.pause();
            toggle.classList.remove('active');
            if (icon) icon.textContent = '🔈';
            localStorage.setItem('stadiumMode', 'false');
        }
    });

    // Handle audio errors
    const handleError = (e) => {
        console.error('Audio source failed to load:', e.target.id);
    };
    anthem.addEventListener('error', handleError);
    fans.addEventListener('error', handleError);
}

/**
 * Global Initialization
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setupStadiumMode };
}
