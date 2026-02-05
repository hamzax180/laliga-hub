/**
 * SHARED UTILITIES FOR LA LIGA HUB
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

    // Check localStorage for audio preference
    let isPlaying = localStorage.getItem('stadiumMode') === 'true';

    // Initial state reflection
    if (isPlaying) {
        // We can't autoplay on load due to browser policies, 
        // but we can show the button as active.
        toggle.classList.add('active');
        if (icon) icon.textContent = '🔊';
    }

    toggle.addEventListener('click', () => {
        if (!isPlaying) {
            audio.play().then(() => {
                toggle.classList.add('active');
                if (icon) icon.textContent = '🔊';
                isPlaying = true;
                localStorage.setItem('stadiumMode', 'true');
                // Fade in volume
                audio.volume = 0;
                let fade = setInterval(() => {
                    if (audio.volume < 0.5) {
                        audio.volume += 0.05;
                    } else {
                        clearInterval(fade);
                    }
                }, 100);
            }).catch(err => {
                console.warn('Audio play failed:', err);
                alert('Click anywhere on the page and then try enabling sound again!');
            });
        } else {
            audio.pause();
            toggle.classList.remove('active');
            if (icon) icon.textContent = '🔈';
            isPlaying = false;
            localStorage.setItem('stadiumMode', 'false');
        }
    });

    // If already playing from state (unlikely to succeed without interaction, 
    // but good for tab-switching persistence if implemented differently)
}

/**
 * Export for use in page scripts
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setupStadiumMode };
}
