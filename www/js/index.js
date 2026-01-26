// www/js/index.js - Updated Main Integration

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Cordova is ready!');
    console.log('Platform:', device.platform);
    console.log('Version:', device.version);
    console.log('Model:', device.model);
    
    // Initialize radio state
    initRadioState();
    
    // Request notification permission for Android 13+
    requestNotificationPermission();
    
    // Initialize radio if not already initialized
    setTimeout(() => {
        if (window.appState && !window.appState.radioInitialized) {
            initRadio();
            window.appState.radioInitialized = true;
        }
    }, 1000);
    
    // Add click handlers for buttons
    setupButtonHandlers();
}

function initRadioState() {
    // Initialize app state if not exists
    window.appState = window.appState || {};
    window.appState.stations = window.appState.stations || [
        {
            id: 0,
            name: "English Gospel",
            url: "https://s3.voscast.com:9425/stream",
            description: "24/7 English Gospel Music",
            type: "mp3"
        },
        {
            id: 1,
            name: "Yoruba Gospel",
            url: "https://s3.voscast.com:10745/stream",
            description: "Yoruba Language Worship",
            type: "mp3"
        },
        {
            id: 2,
            name: "Praise Worship",
            url: "https://stream.zeno.fm/f3wvbbqmdg8uv",
            description: "Contemporary Praise",
            type: "mp3"
        }
    ];
    window.appState.currentStation = window.appState.currentStation || 0;
    window.appState.radioInitialized = window.appState.radioInitialized || false;
    window.appState.radioPlaying = window.appState.radioPlaying || false;
    
    // Update display with current station
    updateRadioDisplay();
}

function requestNotificationPermission() {
    if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
        // Check Android version
        if (device.platform === 'Android') {
            const androidVersion = parseInt(device.version);
            
            // Android 13+ requires POST_NOTIFICATIONS permission
            if (androidVersion >= 13) {
                cordova.plugins.permissions.checkPermission(
                    cordova.plugins.permissions.POST_NOTIFICATIONS,
                    (status) => {
                        if (!status.hasPermission) {
                            cordova.plugins.permissions.requestPermission(
                                cordova.plugins.permissions.POST_NOTIFICATIONS,
                                () => console.log('Notification permission granted'),
                                () => console.warn('Notification permission denied')
                            );
                        } else {
                            console.log('Notification permission already granted');
                        }
                    },
                    (error) => console.error('Permission check error:', error)
                );
            }
        }
    }
}

function setupButtonHandlers() {
    // Play/Pause button
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', toggleRadioPlay);
        playPauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleRadioPlay();
        });
    }
    
    // Next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => switchRadioStation('next'));
        nextBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            switchRadioStation('next');
        });
    }
    
    // Previous button
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => switchRadioStation('prev'));
        prevBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            switchRadioStation('prev');
        });
    }
    
    // Station selection buttons
    const stationButtons = document.querySelectorAll('.station-btn');
    stationButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const stationId = parseInt(this.getAttribute('data-station'));
            selectStation(stationId);
        });
    });
}

function toggleRadioPlay() {
    console.log('Toggle radio play called');
    
    if (window.cordovaAudio) {
        console.log('Using cordovaAudio, isPlaying:', window.cordovaAudio.isPlaying);
        if (window.cordovaAudio.isPlaying) {
            window.cordovaAudio.pause();
        } else {
            window.cordovaAudio.play();
        }
    } else {
        console.log('Using HTML5 fallback');
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
                audio.setAttribute('playsinline', 'true');
                audio.setAttribute('webkit-playsinline', 'true');
                
                audio.play()
                    .then(() => {
                        window.appState.radioPlaying = true;
                        updatePlayButton(true);
                        showToast(`Now playing: ${station.name}`);
                    })
                    .catch(error => {
                        console.error('HTML5 Play failed:', error);
                        showToast('Failed to play radio. Tap play button again.', 'error');
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
        
        console.log('Switching station from', currentIndex, 'to', newIndex);
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
        
        // Update active station button
        updateActiveStationButton(newIndex);
    }
}

function selectStation(stationId) {
    if (window.appState && window.appState.stations) {
        const station = window.appState.stations.find(s => s.id === stationId);
        if (station) {
            console.log('Selected station:', station.name);
            window.appState.currentStation = stationId;
            
            // Update UI
            updateRadioDisplay();
            updateActiveStationButton(stationId);
            
            // Play the station if currently playing
            if (window.cordovaAudio) {
                if (window.cordovaAudio.isPlaying) {
                    window.cordovaAudio.playStation(station);
                }
            } else if (window.appState.radioPlaying) {
                playRadio();
            }
        }
    }
}

function updateActiveStationButton(activeId) {
    // Remove active class from all station buttons
    const stationButtons = document.querySelectorAll('.station-btn');
    stationButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to selected station button
    const activeBtn = document.querySelector(`.station-btn[data-station="${activeId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
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
        
        // Update active station button
        updateActiveStationButton(window.appState.currentStation);
    }
}

function updatePlayButton(isPlaying) {
    const playBtn = document.getElementById('playPauseBtn');
    const playIcon = document.getElementById('playPauseIcon');
    
    if (playBtn && playIcon) {
        if (isPlaying) {
            playIcon.textContent = 'pause';
            playBtn.setAttribute('aria-label', 'Pause radio');
            playBtn.classList.add('playing');
        } else {
            playIcon.textContent = 'play_arrow';
            playBtn.setAttribute('aria-label', 'Play radio');
            playBtn.classList.remove('playing');
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
            background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#0a0f2d'};
            color: ${type === 'warning' ? '#000' : 'white'};
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
}

function initRadio() {
    console.log('Initializing radio...');
    updateRadioDisplay();
    updatePlayButton(false);
}

// Expose functions to global scope
window.toggleRadioPlay = toggleRadioPlay;
window.switchRadioStation = switchRadioStation;
window.updateRadioDisplay = updateRadioDisplay;
window.playRadio = playRadio;
window.pauseRadio = pauseRadio;
window.selectStation = selectStation;
window.updatePlayButton = updatePlayButton;
