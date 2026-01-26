// js/index.js - Main App Integration

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Cordova is ready!');
    
    // Initialize background audio manager
    if (window.BackgroundAudioManager) {
        window.BackgroundAudioManager.init();
    }
    
    // Initialize radio stream manager
    if (window.RadioStreamManager) {
        // Set up radio event listeners
        setupRadioEvents();
    }
    
    // Request notification permission for Android 13+
    requestNotificationPermission();
    
    // Prevent screen timeout during playback
    setupWakeLock();
}

function setupRadioEvents() {
    // Listen for radio events
    document.addEventListener('radiostart', (e) => {
        console.log('Radio started:', e.detail);
        updatePlayButton(true);
        showToast(`Now playing: ${e.detail.name}`);
    });
    
    document.addEventListener('radiopause', () => {
        console.log('Radio paused');
        updatePlayButton(false);
    });
    
    document.addEventListener('radiostop', () => {
        console.log('Radio stopped');
        updatePlayButton(false);
    });
    
    document.addEventListener('radioerror', (e) => {
        console.error('Radio error:', e.detail);
        showToast(`Connection error. Retrying... (${e.detail.retryCount})`, 'error');
    });
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

function setupWakeLock() {
    if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.powerManagement) {
        cordova.plugins.powerManagement.acquire();
        
        // Release on app pause
        document.addEventListener('pause', () => {
            cordova.plugins.powerManagement.release();
        }, false);
        
        // Re-acquire on app resume
        document.addEventListener('resume', () => {
            if (window.RadioStreamManager && window.RadioStreamManager.getIsPlaying()) {
                cordova.plugins.powerManagement.acquire();
            }
        }, false);
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

function toggleRadioPlay() {
    if (window.RadioStreamManager) {
        if (window.RadioStreamManager.getIsPlaying()) {
            window.RadioStreamManager.pause();
        } else {
            window.RadioStreamManager.play();
        }
    }
}

function switchRadioStation(direction) {
    if (window.RadioStreamManager) {
        if (direction === 'next') {
            window.RadioStreamManager.nextStation();
        } else if (direction === 'prev') {
            window.RadioStreamManager.previousStation();
        }
        
        // Update UI
        updateRadioDisplay();
    }
}

function updateRadioDisplay() {
    if (window.RadioStreamManager) {
        const station = window.RadioStreamManager.getCurrentStation();
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

function showToast(message, type = 'info') {
    // Simple toast notification
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
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Expose functions to global scope
window.toggleRadioPlay = toggleRadioPlay;
window.switchRadioStation = switchRadioStation;
window.updateRadioDisplay = updateRadioDisplay;
