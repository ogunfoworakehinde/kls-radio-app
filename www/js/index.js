// www/js/index.js - Updated Main Integration

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Cordova is ready!');
    
    // Request notification permission for Android 13+
    requestNotificationPermission();
    
    // Initialize radio if not already initialized
    setTimeout(() => {
        if (window.appState && !window.appState.radioInitialized) {
            initRadio();
            window.appState.radioInitialized = true;
        }
    }, 1000);
}

function requestNotificationPermission() {
    if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
        cordova.plugins.permissions.checkPermission(
            cordova.plugins.permissions.POST_NOTIFICATIONS,
            (status) => {
                if (!status.hasPermission) {
                    cordova.plugins.permissions.requestPermission(
                        cordova.plugins.permissions.POST_NOTIFICATIONS,
                        () => console.log('Notification permission granted'),
                        () => console.warn('Notification permission denied')
                    );
                }
            }
        );
    }
}

function toggleRadioPlay() {
    if (window.cordovaAudio) {
        if (window.cordovaAudio.isPlaying) {
            window.cordovaAudio.pause();
        } else {
            window.cordovaAudio.play();
        }
    } else {
        // Fallback to HTML5 audio
        if (window.appState && window.appState.radioPlaying) {
            pauseRadio();
        } else {
            playRadio();
        }
    }
}

function playRadio() {
    if (window.appState && window.appState.stations) {
        const station = window.appState.stations[window.appState.currentStation || 0];
        
        if (window.cordovaAudio) {
            window.cordovaAudio.playStation(station);
        } else {
            // HTML5 fallback
            const audio = document.getElementById('radioAudio');
            if (audio) {
                audio.src = station.url;
                audio.play()
                    .then(() => {
                        window.appState.radioPlaying = true;
                        updatePlayButton(true);
                        showToast(`Now playing: ${station.name}`);
                    })
                    .catch(error => {
                        console.error('Play failed:', error);
                        showToast('Failed to play radio', 'error');
                    });
            }
        }
    }
}

function pauseRadio() {
    if (window.cordovaAudio) {
        window.cordovaAudio.pause();
    } else {
        const audio = document.getElementById('radioAudio');
        if (audio) {
            audio.pause();
            window.appState.radioPlaying = false;
            updatePlayButton(false);
        }
    }
}

function switchRadioStation(direction) {
    if (window.appState && window.appState.stations) {
        const currentIndex = window.appState.currentStation || 0;
        const totalStations = window.appState.stations.length;
        
        let newIndex;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % totalStations;
        } else if (direction === 'prev') {
            newIndex = (currentIndex - 1 + totalStations) % totalStations;
        } else {
            return;
        }
        
        window.appState.currentStation = newIndex;
        const station = window.appState.stations[newIndex];
        
        // Update UI
        updateRadioDisplay();
        
        // Play the station
        if (window.cordovaAudio) {
            if (window.cordovaAudio.isPlaying) {
                window.cordovaAudio.playStation(station);
            }
        } else if (window.appState.radioPlaying) {
            playRadio();
        }
    }
}

function updateRadioDisplay() {
    if (window.appState && window.appState.stations) {
        const station = window.appState.stations[window.appState.currentStation || 0];
        const currentStationEl = document.getElementById('currentStation');
        const currentChannelEl = document.getElementById('currentChannel');
        
        if (currentStationEl) {
            currentStationEl.textContent = station.name;
        }
        
        if (currentChannelEl) {
            currentChannelEl.textContent = station.description;
        }
    }
}

function updatePlayButton(isPlaying) {
    const playBtn = document.getElementById('playPauseBtn');
    const playIcon = document.getElementById('playPauseIcon');
    
    if (playBtn && playIcon) {
        if (isPlaying) {
            playIcon.textContent = 'pause';
            playBtn.setAttribute('aria-label', 'Pause radio');
        } else {
            playIcon.textContent = 'play_arrow';
            playBtn.setAttribute('aria-label', 'Play radio');
        }
    }
}

function showToast(message, type = 'info') {
    // Use cordovaAudio's toast if available
    if (window.cordovaAudio && window.cordovaAudio.showToast) {
        window.cordovaAudio.showToast(message, type);
    } else {
        // Simple fallback toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : '#0a0f2d'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }
}

// Expose functions to global scope
window.toggleRadioPlay = toggleRadioPlay;
window.switchRadioStation = switchRadioStation;
window.updateRadioDisplay = updateRadioDisplay;
window.playRadio = playRadio;
window.pauseRadio = pauseRadio;
