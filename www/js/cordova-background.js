// www/js/cordova-background.js - Complete Working Background Audio Service

class CordovaBackgroundAudio {
    constructor() {
        this.isPlaying = false;
        this.currentStation = null;
        this.audio = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.isInitialized = false;
        this.init();
    }

    init() {
        console.log('CordovaBackgroundAudio: Initializing...');
        
        // Wait for device ready
        if (typeof document !== 'undefined') {
            document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
            
            // Handle app lifecycle
            document.addEventListener('pause', this.onAppPause.bind(this), false);
            document.addEventListener('resume', this.onAppResume.bind(this), false);
            document.addEventListener('backbutton', this.onBackButton.bind(this), false);
        } else {
            console.warn('Document not available, running in browser?');
            // Simulate device ready for browser testing
            setTimeout(this.onDeviceReady.bind(this), 1000);
        }
    }

    onDeviceReady() {
        console.log('CordovaBackgroundAudio: Device ready');
        console.log('Platform:', device ? device.platform : 'browser');
        console.log('Version:', device ? device.version : 'N/A');
        
        // Initialize stations
        this.initializeStations();
        
        // Request permissions for Android
        this.requestAndroidPermissions();
        
        // Initialize background mode
        this.initBackgroundMode();
        
        // Initialize music controls
        this.initMusicControls();
        
        this.isInitialized = true;
        console.log('CordovaBackgroundAudio: Initialization complete');
    }

    initializeStations() {
        // Define stations if not already defined
        if (!window.appState || !window.appState.stations) {
            window.appState = window.appState || {};
            window.appState.stations = [
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
        }
        
        console.log('Stations initialized:', window.appState.stations.length);
    }

    async requestAndroidPermissions() {
        // Only for Android
        if (device && device.platform === 'Android') {
            try {
                const androidVersion = parseInt(device.version);
                
                if (cordova.plugins && cordova.plugins.permissions) {
                    console.log('Requesting Android permissions...');
                    
                    // Request foreground service permission (Android 9+)
                    if (androidVersion >= 9) {
                        await this.requestPermission('android.permission.FOREGROUND_SERVICE');
                    }
                    
                    // Request notification permission (Android 13+)
                    if (androidVersion >= 13) {
                        await this.requestPermission('android.permission.POST_NOTIFICATIONS');
                    }
                    
                    // Request wake lock permission
                    await this.requestPermission('android.permission.WAKE_LOCK');
                    
                    console.log('All permissions requested');
                }
            } catch (error) {
                console.error('Permission request error:', error);
            }
        }
    }

    requestPermission(permission) {
        return new Promise((resolve, reject) => {
            if (cordova.plugins && cordova.plugins.permissions) {
                cordova.plugins.permissions.checkPermission(
                    permission,
                    (status) => {
                        if (status.hasPermission) {
                            console.log(`Permission ${permission} already granted`);
                            resolve(true);
                        } else {
                            console.log(`Requesting permission: ${permission}`);
                            cordova.plugins.permissions.requestPermission(
                                permission,
                                (result) => {
                                    console.log(`Permission ${permission} granted:`, result.hasPermission);
                                    resolve(result.hasPermission);
                                },
                                (error) => {
                                    console.warn(`Permission ${permission} denied:`, error);
                                    resolve(false);
                                }
                            );
                        }
                    },
                    (error) => {
                        console.error(`Permission check error for ${permission}:`, error);
                        resolve(false);
                    }
                );
            } else {
                resolve(false);
            }
        });
    }

    initBackgroundMode() {
        if (window.cordova && cordova.plugins && cordova.plugins.backgroundMode) {
            try {
                console.log('Initializing background mode...');
                
                // Enable background mode
                cordova.plugins.backgroundMode.enable();
                
                // Configure based on platform
                if (device && device.platform === 'Android') {
                    // Android configuration
                    cordova.plugins.backgroundMode.configure({
                        title: 'KLS Radio',
                        text: 'Playing Gospel Music',
                        icon: 'ic_notification',
                        color: 'ff0a0f2d',
                        channelName: 'KLS Radio Player',
                        channelDescription: 'Background audio playback',
                        importance: 4,
                        allowClose: false,
                        hidden: false,
                        bigText: true,
                        resume: true,
                        silent: false,
                        foreground: true,
                        allowBackground: true,
                        persistent: true
                    });
                } else {
                    // iOS/other configuration
                    cordova.plugins.backgroundMode.setDefaults({
                        title: 'KLS Radio',
                        text: 'Playing Gospel Music',
                        hidden: false,
                        bigText: true
                    });
                }
                
                // Event listeners
                cordova.plugins.backgroundMode.on('activate', () => {
                    console.log('Background mode activated');
                    this.updateNotification();
                });
                
                cordova.plugins.backgroundMode.on('deactivate', () => {
                    console.log('Background mode deactivated');
                });
                
                cordova.plugins.backgroundMode.on('failure', (errorCode) => {
                    console.error('Background mode failure:', errorCode);
                });
                
                console.log('Background mode initialized');
                
            } catch (error) {
                console.error('Background mode init error:', error);
            }
        } else {
            console.warn('Background mode plugin not available');
        }
    }

    initMusicControls() {
        if (typeof MusicControls !== 'undefined') {
            try {
                console.log('Initializing music controls...');
                
                MusicControls.create({
                    track: 'KLS Radio',
                    artist: 'Kingdom Lifestyle Radio',
                    cover: 'icon',
                    isPlaying: false,
                    dismissable: false,
                    hasPrev: true,
                    hasNext: true,
                    hasClose: false,
                    ticker: 'Now playing: KLS Radio'
                });
                
                MusicControls.subscribe((event) => {
                    console.log('MusicControls event:', event);
                    this.onMusicControlsEvent(event);
                });
                
                MusicControls.listen();
                console.log('Music controls initialized');
                
            } catch (error) {
                console.error('Music controls init error:', error);
            }
        } else {
            console.warn('MusicControls plugin not available');
        }
    }

    onMusicControlsEvent(event) {
        switch(event.message) {
            case 'music-controls-next':
                this.nextStation();
                break;
            case 'music-controls-previous':
                this.previousStation();
                break;
            case 'music-controls-pause':
                this.pause();
                break;
            case 'music-controls-play':
                this.play();
                break;
            case 'music-controls-toggle-play-pause':
                this.togglePlayPause();
                break;
        }
    }

    onAppPause() {
        console.log('App paused');
        // Ensure background mode stays active
        if (this.isPlaying && cordova.plugins && cordova.plugins.backgroundMode) {
            if (!cordova.plugins.backgroundMode.isEnabled()) {
                cordova.plugins.backgroundMode.enable();
            }
        }
    }

    onAppResume() {
        console.log('App resumed');
        // Update UI state
        if (window.updatePlayButton) {
            window.updatePlayButton(this.isPlaying);
        }
    }

    onBackButton(e) {
        // Don't exit app if playing, just minimize
        if (this.isPlaying) {
            e.preventDefault();
            if (navigator.app) {
                navigator.app.exitApp();
            } else if (navigator.device) {
                navigator.device.exitApp();
            }
        }
    }

    playStation(station) {
        if (!station || !station.url) {
            console.error('Invalid station');
            this.showToast('Invalid station URL', 'error');
            return;
        }
        
        console.log('Playing station:', station.name);
        this.currentStation = station;
        
        // Stop existing audio
        this.stop();
        
        // Reset retry count
        this.retryCount = 0;
        
        // Create audio element
        this.audio = new Audio();
        this.audio.src = station.url;
        this.audio.crossOrigin = 'anonymous';
        this.audio.preload = 'auto';
        this.audio.volume = 1.0;
        
        // Critical for mobile playback
        this.audio.setAttribute('playsinline', 'true');
        this.audio.setAttribute('webkit-playsinline', 'true');
        
        // Event listeners
        this.setupAudioEvents();
        
        // Start playback
        this.startPlayback();
    }

    setupAudioEvents() {
        this.audio.onplaying = () => {
            console.log('Audio playback started');
            this.isPlaying = true;
            this.retryCount = 0;
            
            // Enable background mode
            this.activateBackgroundMode();
            
            // Update UI and notification
            this.onPlaybackStarted(this.currentStation);
            this.updateNotification();
        };
        
        this.audio.onpause = () => {
            console.log('Audio paused');
            this.isPlaying = false;
            this.updateNotification();
            
            if (window.updatePlayButton) {
                window.updatePlayButton(false);
            }
        };
        
        this.audio.onerror = (error) => {
            console.error('Audio error:', error);
            this.isPlaying = false;
            this.onPlaybackError(this.currentStation);
        };
        
        this.audio.onended = () => {
            console.log('Audio ended - restarting...');
            this.isPlaying = false;
            setTimeout(() => {
                if (this.currentStation) {
                    this.playStation(this.currentStation);
                }
            }, 1000);
        };
        
        this.audio.onstalled = () => {
            console.log('Audio stalled - buffering...');
        };
        
        this.audio.onwaiting = () => {
            console.log('Audio waiting - buffering...');
        };
    }

    activateBackgroundMode() {
        if (cordova.plugins && cordova.plugins.backgroundMode) {
            if (!cordova.plugins.backgroundMode.isEnabled()) {
                cordova.plugins.backgroundMode.enable();
            }
            
            // Move to foreground service (Android)
            if (device && device.platform === 'Android') {
                setTimeout(() => {
                    try {
                        cordova.plugins.backgroundMode.moveToForeground();
                    } catch (e) {
                        console.log('Move to foreground failed:', e);
                    }
                }, 100);
            }
        }
    }

    startPlayback() {
        this.audio.play()
            .then(() => {
                console.log('Playback promise resolved');
            })
            .catch(error => {
                console.error('Play failed:', error.name, error.message);
                
                if (error.name === 'NotAllowedError') {
                    this.showToast('Tap play button to start radio', 'info');
                } else {
                    this.onPlaybackError(this.currentStation);
                }
            });
    }

    play() {
        if (!this.isInitialized) {
            console.warn('Audio service not initialized yet');
            return;
        }
        
        if (window.appState && window.appState.stations) {
            const stationIndex = window.appState.currentStation || 0;
            const station = window.appState.stations[stationIndex];
            
            if (station) {
                this.playStation(station);
            }
        }
    }

    pause() {
        if (this.audio && this.isPlaying) {
            console.log('Pausing audio');
            this.audio.pause();
            this.isPlaying = false;
            this.updateNotification();
            
            if (window.updatePlayButton) {
                window.updatePlayButton(false);
            }
        }
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    stop() {
        if (this.audio) {
            console.log('Stopping audio');
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
            this.isPlaying = false;
            this.updateNotification();
            
            if (window.updatePlayButton) {
                window.updatePlayButton(false);
            }
        }
    }

    nextStation() {
        if (window.appState && window.appState.stations) {
            const stations = window.appState.stations;
            const currentIndex = window.appState.currentStation || 0;
            const nextIndex = (currentIndex + 1) % stations.length;
            const station = stations[nextIndex];
            
            if (station) {
                console.log('Switching to next station:', station.name);
                window.appState.currentStation = nextIndex;
                
                // Update UI
                if (window.updateRadioDisplay) {
                    window.updateRadioDisplay();
                }
                
                // Play if currently playing
                if (this.isPlaying) {
                    this.playStation(station);
                }
            }
        }
    }

    previousStation() {
        if (window.appState && window.appState.stations) {
            const stations = window.appState.stations;
            const currentIndex = window.appState.currentStation || 0;
            const prevIndex = (currentIndex - 1 + stations.length) % stations.length;
            const station = stations[prevIndex];
            
            if (station) {
                console.log('Switching to previous station:', station.name);
                window.appState.currentStation = prevIndex;
                
                // Update UI
                if (window.updateRadioDisplay) {
                    window.updateRadioDisplay();
                }
                
                // Play if currently playing
                if (this.isPlaying) {
                    this.playStation(station);
                }
            }
        }
    }

    updateNotification() {
        // Update music controls
        if (typeof MusicControls !== 'undefined') {
            const station = this.currentStation || { 
                name: 'KLS Radio', 
                description: 'Kingdom Lifestyle Radio' 
            };
            
            try {
                MusicControls.updateIsPlaying(this.isPlaying);
                MusicControls.update({
                    track: station.name,
                    artist: station.description,
                    isPlaying: this.isPlaying
                });
            } catch (error) {
                console.error('Music controls update failed:', error);
            }
        }
        
        // Update background mode notification
        if (cordova.plugins && cordova.plugins.backgroundMode) {
            const station = this.currentStation || { 
                name: 'KLS Radio', 
                description: 'Kingdom Lifestyle Radio' 
            };
            
            try {
                if (this.isPlaying) {
                    cordova.plugins.backgroundMode.configure({
                        text: `Playing: ${station.name}`,
                        title: 'KLS Radio'
                    });
                } else {
                    cordova.plugins.backgroundMode.configure({
                        text: 'Paused',
                        title: 'KLS Radio'
                    });
                }
            } catch (error) {
                console.error('Background mode update failed:', error);
            }
        }
    }

    onPlaybackStarted(station) {
        console.log(`Playback started: ${station.name}`);
        
        // Update UI
        if (window.updateRadioDisplay) {
            window.updateRadioDisplay();
        }
        
        if (window.updatePlayButton) {
            window.updatePlayButton(true);
        }
        
        // Show toast
        this.showToast(`Now playing: ${station.name}`);
    }

    onPlaybackError(station) {
        console.error(`Playback error for: ${station.name}`);
        
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            this.showToast(`Reconnecting... (${this.retryCount}/${this.maxRetries})`, 'warning');
            
            // Retry after delay
            setTimeout(() => {
                if (this.currentStation === station) {
                    console.log(`Retry attempt ${this.retryCount} for ${station.name}`);
                    this.playStation(station);
                }
            }, 3000);
        } else {
            this.showToast(`Connection failed: ${station.name}`, 'error');
            this.isPlaying = false;
            this.updateNotification();
            
            // Reset retry count
            setTimeout(() => {
                this.retryCount = 0;
            }, 10000);
        }
    }

    showToast(message, type = 'info') {
        // Create toast element
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
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
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

// Create global instance immediately
window.cordovaAudio = new CordovaBackgroundAudio();

// Add CSS animations
if (typeof document !== 'undefined' && !document.querySelector('#toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
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
}
