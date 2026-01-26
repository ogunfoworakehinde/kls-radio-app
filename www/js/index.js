// www/js/index.js - Main App Integration

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Device ready! Starting KLS Radio...');
    
    // Initialize app state
    initAppState();
    
    // Setup UI
    setupUI();
    
    // Check if cordovaAudio is available
    if (window.cordovaAudio) {
        console.log('Cordova audio service available');
    } else {
        console.error('Cordova audio service not available');
    }
}

function initAppState() {
    // Initialize or restore app state
    window.appState = window.appState || {};
    
    // Stations configuration
    window.appState.stations = [
        {
            id: 0,
            name: "English Gospel",
            url: "https://s3.voscast.com:9425/stream",
            description: "24/7 English Gospel Music",
            type: "mp3",
            color: "#0a0f2d"
        },
        {
            id: 1,
            name: "Yoruba Gospel",
            url: "https://s3.voscast.com:10745/stream",
            description: "Yoruba Language Worship",
            type: "mp3",
            color: "#1a3d7c"
        },
        {
            id: 2,
            name: "Praise Worship",
            url: "https://stream.zeno.fm/f3wvbbqmdg8uv",
            description: "Contemporary Praise",
            type: "mp3",
            color: "#2a5c9c"
        }
    ];
    
    // Current state
    window.appState.currentStation = window.appState.currentStation || 0;
    window.appState.isPlaying = false;
    window.appState.volume = 1.0;
    
    console.log('App state initialized with', window.appState.stations.length, 'stations');
}

function setupUI() {
    // Create station buttons
    createStationButtons();
    
    // Update display
    updateRadioDisplay();
    
    // Setup event listeners
    setupEventListeners();
    
    // Add CSS for active station
    addActiveStationCSS();
}

function createStationButtons() {
    const stationsContainer = document.getElementById('stationsContainer');
    if (!stationsContainer) return;
    
    stationsContainer.innerHTML = '';
    
    window.appState.stations.forEach((station, index) => {
        const button = document.createElement('button');
        button.className = 'station-btn';
        button.setAttribute('data-station', station.id);
        button.innerHTML = `
            <span class="station-name">${station.name}</span>
            <span class="station-desc">${station.description}</span>
        `;
        
        button.style.backgroundColor = station.color || '#0a0f2d';
        
        button.addEventListener('click', () => selectStation(station.id));
        
        stationsContainer.appendChild(button);
    });
}

function setupEventListeners() {
    // Play/Pause button
    const playBtn = document.getElementById('playPauseBtn');
    if (playBtn) {
        playBtn.addEventListener('click', togglePlayPause);
        playBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            togglePlayPause();
        });
    }
    
    // Next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => switchStation('next'));
        nextBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            switchStation('next');
        });
    }
    
    // Previous button
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => switchStation('prev'));
        prevBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            switchStation('prev');
        });
    }
    
    // Volume control
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.value = window.appState.volume * 100;
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            window.appState.volume = volume;
            if (window.cordovaAudio && window.cordovaAudio.audio) {
                window.cordovaAudio.audio.volume = volume;
            }
            updateVolumeDisplay(volume);
        });
    }
}

function addActiveStationCSS() {
    const style = document.createElement('style');
    style.textContent = `
        .station-btn.active {
            border: 3px solid #fff;
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
            transform: scale(1.05);
        }
        
        .play-btn.playing {
            background-color: #dc3545 !important;
        }
        
        .play-btn.playing .play-icon {
            content: 'pause';
        }
    `;
    document.head.appendChild(style);
}

function togglePlayPause() {
    console.log('Toggle play/pause');
    
    if (window.cordovaAudio) {
        if (window.cordovaAudio.isPlaying) {
            window.cordovaAudio.pause();
        } else {
            window.cordovaAudio.play();
        }
    } else {
        // Fallback for browser testing
        if (window.appState.isPlaying) {
            pauseRadio();
        } else {
            playRadio();
        }
    }
}

function playRadio() {
    const station = window.appState.stations[window.appState.currentStation];
    if (station) {
        window.appState.isPlaying = true;
        updatePlayButton(true);
        showToast(`Now playing: ${station.name}`);
        
        // In browser, create audio element
        if (!window.cordovaAudio) {
            const audio = document.getElementById('radioAudio');
            if (!audio) {
                const newAudio = new Audio(station.url);
                newAudio.id = 'radioAudio';
                newAudio.volume = window.appState.volume;
                document.body.appendChild(newAudio);
                newAudio.play();
            } else {
                audio.src = station.url;
                audio.play();
            }
        }
    }
}

function pauseRadio() {
    window.appState.isPlaying = false;
    updatePlayButton(false);
    
    if (!window.cordovaAudio) {
        const audio = document.getElementById('radioAudio');
        if (audio) {
            audio.pause();
        }
    }
}

function switchStation(direction) {
    const stations = window.appState.stations;
    const currentIndex = window.appState.currentStation;
    
    let newIndex;
    if (direction === 'next') {
        newIndex = (currentIndex + 1) % stations.length;
    } else {
        newIndex = (currentIndex - 1 + stations.length) % stations.length;
    }
    
    window.appState.currentStation = newIndex;
    updateRadioDisplay();
    
    // If currently playing, switch station
    const wasPlaying = window.cordovaAudio ? window.cordovaAudio.isPlaying : window.appState.isPlaying;
    if (wasPlaying) {
        if (window.cordovaAudio) {
            window.cordovaAudio.playStation(stations[newIndex]);
        } else {
            playRadio();
        }
    }
}

function selectStation(stationId) {
    const stationIndex = window.appState.stations.findIndex(s => s.id === stationId);
    if (stationIndex !== -1) {
        window.appState.currentStation = stationIndex;
        updateRadioDisplay();
        
        // If currently playing, switch to selected station
        const wasPlaying = window.cordovaAudio ? window.cordovaAudio.isPlaying : window.appState.isPlaying;
        if (wasPlaying) {
            if (window.cordovaAudio) {
                window.cordovaAudio.playStation(window.appState.stations[stationIndex]);
            } else {
                playRadio();
            }
        }
    }
}

function updateRadioDisplay() {
    const station = window.appState.stations[window.appState.currentStation];
    if (!station) return;
    
    // Update station info
    const stationNameEl = document.getElementById('currentStation');
    const stationDescEl = document.getElementById('currentChannel');
    
    if (stationNameEl) stationNameEl.textContent = station.name;
    if (stationDescEl) stationDescEl.textContent = station.description;
    
    // Update active station button
    document.querySelectorAll('.station-btn').forEach(btn => {
        const btnStationId = parseInt(btn.getAttribute('data-station'));
        if (btnStationId === station.id) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update background color
    document.body.style.backgroundColor = station.color || '#0a0f2d';
}

function updatePlayButton(isPlaying) {
    const playBtn = document.getElementById('playPauseBtn');
    const playIcon = document.getElementById('playPauseIcon');
    
    if (playBtn && playIcon) {
        if (isPlaying) {
            playIcon.textContent = 'pause';
            playBtn.classList.add('playing');
            playBtn.setAttribute('aria-label', 'Pause radio');
        } else {
            playIcon.textContent = 'play_arrow';
            playBtn.classList.remove('playing');
            playBtn.setAttribute('aria-label', 'Play radio');
        }
    }
    
    window.appState.isPlaying = isPlaying;
}

function updateVolumeDisplay(volume) {
    const volumeDisplay = document.getElementById('volumeDisplay');
    if (volumeDisplay) {
        volumeDisplay.textContent = `${Math.round(volume * 100)}%`;
    }
}

function showToast(message, type = 'info') {
    if (window.cordovaAudio && window.cordovaAudio.showToast) {
        window.cordovaAudio.showToast(message, type);
    } else {
        // Simple toast fallback
        const toast = document.createElement('div');
        toast.textContent = message;
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
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }
}

// Make functions available globally
window.togglePlayPause = togglePlayPause;
window.switchStation = switchStation;
window.selectStation = selectStation;
window.updateRadioDisplay = updateRadioDisplay;
window.updatePlayButton = updatePlayButton;
window.playRadio = playRadio;
window.pauseRadio = pauseRadio;
