document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.querySelector('.play-input');
    const rangeInput = document.querySelector('.range');
    const volumeLabel = document.querySelector('.volume-group');
    const nextBtn = document.querySelector('.next-btn');
    const playLabel = document.querySelector('.input-group');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeValue = document.querySelector('.volume-value');
    const modal = document.getElementById('volumeModal');
    const modalClose = document.querySelector('.modal-close');
    let wakeLock = null;

    // Function to request fullscreen
    function requestFullScreen() {
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { // Safari
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) { // Firefox
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) { // IE11
            element.msRequestFullscreen();
        }
    }

    // Request fullscreen when user interacts with the page
    document.addEventListener('click', () => {
        requestFullScreen();
    }, { once: true });

    // Also try to request fullscreen on load
    requestFullScreen();

    // Request wake lock when audio starts playing
    async function requestWakeLock() {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock is active');
        } catch (err) {
            console.log(`${err.name}, ${err.message}`);
        }
    }

    // Release wake lock when audio ends
    function releaseWakeLock() {
        if (wakeLock !== null) {
            wakeLock.release()
                .then(() => {
                    wakeLock = null;
                    console.log('Wake Lock released');
                });
        }
    }

    let isVolumeStep = false;

    // Initial state
    volumeLabel.style.display = 'none';
    nextBtn.disabled = true;

    function updateButtonState(volume) {
        if (volume >= 96) {
            nextBtn.disabled = false;
            nextBtn.classList.add('ready-to-play');
            volumeValue.classList.add('ready-to-play');
        } else {
            nextBtn.disabled = false; // Enable button but show modal if clicked
            nextBtn.classList.remove('ready-to-play');
            volumeValue.classList.remove('ready-to-play');
        }
    }

    function showModal() {
        modal.style.display = 'flex';
        // Force a reflow
        modal.offsetHeight;
        modal.classList.add('show');
    }

    function hideModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Match the transition duration
    }

    function startPlayback() {
        // Disable volume control during playback
        rangeInput.disabled = true;
        nextBtn.textContent = 'Playing...';
        nextBtn.disabled = true;
        volumeValue.classList.add('playing');
        requestWakeLock(); // Request wake lock when audio starts
    }

    function resetPlayer() {
        // Reset all states
        isVolumeStep = false;
        playLabel.style.display = 'grid';
        volumeLabel.style.display = 'none';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = true;
        textInput.value = '';
        rangeInput.value = 50;
        rangeInput.disabled = false;
        volumeValue.textContent = '50%';
        volumeValue.classList.remove('playing', 'ready-to-play');
        nextBtn.classList.remove('ready-to-play');
        releaseWakeLock(); // Release wake lock when audio ends
    }

    textInput.addEventListener('input', (e) => {
        const inputValue = e.target.value.toLowerCase();
        
        if (inputValue === 'play') {
            nextBtn.disabled = false;
        } else {
            nextBtn.disabled = true;
        }
    });

    // Update volume when slider changes
    rangeInput.addEventListener('input', (e) => {
        const volume = e.target.value;
        audioPlayer.volume = volume / 100;
        volumeValue.textContent = `${volume}%`;
        updateButtonState(volume);
    });

    nextBtn.addEventListener('click', () => {
        if (!isVolumeStep) {
            // First step: Hide play input and show volume controls
            playLabel.style.display = 'none';
            volumeLabel.style.display = 'grid';
            nextBtn.textContent = 'Finish';
            isVolumeStep = true;
            updateButtonState(rangeInput.value);
        } else {
            // Check volume before playing
            const currentVolume = parseInt(rangeInput.value);
            if (currentVolume >= 96) {
                // Second step: Play audio and handle completion
                audioPlayer.play();
                startPlayback();

                // When audio ends
                audioPlayer.addEventListener('ended', resetPlayer);
            } else {
                showModal();
            }
        }
    });

    // Close modal when clicking the close button
    modalClose.addEventListener('click', hideModal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && !audioPlayer.paused) {
            // Keep audio playing when screen is off
            audioPlayer.play();
        }
    });
});