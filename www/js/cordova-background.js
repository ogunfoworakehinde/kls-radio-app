// www/js/cordova-background.js - Simple Cordova Background Audio

class CordovaBackgroundAudio {
    constructor() {
        this.isPlaying = false;
        this.currentStation = null;
        this.audio = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.init();
    }

    init() {
        // Wait for device ready
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        
        // Handle app lifecycle
        document.addEventListener('pause', this.onAppPause.bind(this), false);
        document.addEventListener('resume', this.onAppResume.bind(this), false);
        
        // Handle visibility change
        document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this), false);
    }

    onDeviceReady() {
        console.log('CordovaBackgroundAudio: Device ready');
        console.log('Platform:', device.platform);
        console.log('Version:', device.version);
        
        // Request all necessary permissions
        this.requestAllPermissions();
        
        // Initialize background mode if plugin exists
        if (window.cordova && cordova.plugins && cordova.plugins.backgroundMode) {
            this.initBackgroundMode();
        } else {
            console.error('Background Mode plugin not available!');
        }
        
        // Initialize music controls if plugin exists
        if (typeof MusicControls !== 'undefined') {
            this.initMusicControls();
        } else {
            console.warn('MusicControls plugin not available');
        }
        
        // Initialize stations if available
        this.initializeStations();
    }

    async requestAllPermissions() {
        if (typeof device === 'undefined') {
            console.log('Device plugin not available');
            return;
        }
        
        // Only for Android
        if (device.platform === 'Android') {
            try {
                if (cordova.plugins && cordova.plugins.permissions) {
                    console.log('Requesting permissions...');
                    
                    // Check Android version
                    const androidVersion = parseInt(device.version);
                    
                    // Always request these permissions
                    const permissions = [
                        'android.permission.FOREGROUND_SERVICE',
                        'android.permission.WAKE_LOCK'
                    ];
                    
                    // Add notification permission for Android 13+
                    if (androidVersion >= 13) {
                        permissions.push('android.permission.POST_NOTIFICATIONS');
                    }
                    
                    // Request permissions
                    cordova.plugins.permissions.requestPermissions(
                        permissions,
                        (success) => {
                            console.log('Permissions granted:', success);
                            
                            // Request battery optimization exemption
                            this.requestIgnoreBatteryOptimizations();
                        },
                        (failure) => {
                            console.warn('Some permissions denied:', failure);
                        }
                    );
                }
            } catch (error) {
                console.error('Permission request failed:', error);
            }
        }
    }

    requestIgnoreBatteryOptimizations() {
        if (device.platform === 'Android') {
            try {
                if (cordova.plugins && cordova.plugins.permissions) {
                    cordova.plugins.permissions.checkPermission(
                        'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
                        (status) => {
                            if (!status.hasPermission) {
                                console.log('Requesting battery optimization exemption...');
                                // Note: This requires user to manually enable in settings
                            }
                        }
                    );
                }
            } catch (error) {
                console.error('Battery optimization request failed:', error);
            }
        }
    }

    initBackgroundMode() {
        try {
            console.log('Initializing background mode...');
            
            // First disable then enable to ensure clean state
            cordova.plugins.backgroundMode.disable();
            
            // Enable background mode
            cordova.plugins.backgroundMode.enable();
            
            // Configure based on platform
            if (device.platform === 'Android') {
                cordova.plugins.backgroundMode.configure({
                    title: 'KLS Radio',
                    text: 'Playing Gospel Music',
                    icon: 'ic_notification',
                    color: 'ff0a0f2d', // ARGB format (alpha + color)
                    channelName: 'KLS Radio Player',
                    channelDescription: 'Background audio playback',
                    importance: 4, // IMPORTANCE_HIGH
                    allowClose: false,
                    hidden: false,
                    bigText: true,
                    resume: true,
                    silent: false,
                    foreground: true, // CRITICAL: Run as foreground service
                    allowBackground: true,
                    persistent: true,
                    autoStart: true
                });
            } else {
                // iOS configuration
                cordova.plugins.backgroundMode.setDefaults({
                    title: 'KLS Radio',
                    text: 'Playing Gospel Music',
                    hidden: false,
                    bigText: true
                });
            }
            
            // Set up event listeners
            cordova.plugins.backgroundMode.on('activate', () => {
                console.log('Background mode activated - Starting foreground service');
                this.updateNotification();
                
                // Ensure audio continues playing
                if (this.isPlaying && this.audio && this.audio.paused) {
                    this.audio.play().catch(e => console.error('Background play failed:', e));
                }
            });
            
            cordova.plugins.backgroundMode.on('deactivate', () => {
                console.log('Background mode deactivated');
            });
            
            cordova.plugins.backgroundMode.on('failure', (errorCode) => {
                console.error('Background mode failure:', errorCode);
                // Try to re-enable
                setTimeout(() => {
                    cordova.plugins.backgroundMode.enable();
                }, 1000);
            });
            
            cordova.plugins.backgroundMode.on('enable', () => {
                console.log('Background mode enabled');
            });
            
            cordova.plugins.backgroundMode.on('disable', () => {
                console.log('Background mode disabled');
            });
            
            console.log('Background mode initialized successfully');
            
        } catch (error) {
            console.error('Background mode initialization failed:', error);
        }
    }

    initMusicControls() {
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
                hasSkipForward: false,
                hasSkipBackward: false,
                ticker: 'Now playing: KLS Radio',
                // Android-specific icons
                playIcon: 'media_play',
                pauseIcon: 'media_pause',
                prevIcon: 'media_prev',
                nextIcon: 'media_next',
                closeIcon: 'media_close',
                notificationIcon: 'notification'
            });
            
            // Subscribe to events
            MusicControls.subscribe((event) => {
                console.log('MusicControls event received:', event);
                this.onMusicControlsEvent(event);
            });
            
            // Start listening
            MusicControls.listen();
            
            console.log('Music controls initialized successfully');
            
        } catch (error) {
            console.error('Music controls initialization failed:', error);
        }
    }

    onMusicControlsEvent(event) {
        console.log('MusicControls event:', event);
        
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
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
                break;
            case 'music-controls-destroy':
                // Handle notification destruction
                break;
        }
    }

    onAppPause() {
        console.log('App paused');
        // Keep playing in background
        if (this.isPlaying && cordova.plugins && cordova.plugins.backgroundMode) {
            if (!cordova.plugins.backgroundMode.isEnabled()) {
                cordova.plugins.backgroundMode.enable();
            }
        }
    }

    onAppResume() {
        console.log('App resumed');
        if (this.isPlaying) {
            this.updateNotification();
        }
    }

    onVisibilityChange() {
        console.log('Visibility changed:', document.visibilityState);
        if (document.visibilityState === 'hidden' && this.isPlaying) {
            // Ensure background mode is active when app goes to background
            if (cordova.plugins && cordova.plugins.backgroundMode) {
                if (!cordova.plugins.backgroundMode.isEnabled()) {
                    cordova.plugins.backgroundMode.enable();
                }
            }
        }
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
            window.appState.currentStation = 0;
        }
    }

    playStation(station) {
        if (!station || !station.url) {
            console.error('Invalid station');
            this.showToast('Invalid station selected', 'error');
            return;
        }
        
        console.log('Playing station:', station.name, 'URL:', station.url);
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
        
        // Critical: Set these attributes for mobile playback
        this.audio.setAttribute('playsinline', 'true');
        this.audio.setAttribute('webkit-playsinline', 'true');
        this.audio.setAttribute('preload', 'auto');
        
        // Set up event listeners
        this.audio.onplaying = () => {
            console.log('Audio playback started');
            this.isPlaying = true;
            this.retryCount = 0;
            
            // Enable and update background mode
            if (cordova.plugins && cordova.plugins.backgroundMode) {
                if (!cordova.plugins.backgroundMode.isEnabled()) {
                    cordova.plugins.backgroundMode.enable();
                }
                
                // Move to foreground service (Android)
                if (device.platform === 'Android') {
                    setTimeout(() => {
                        try {
                            cordova.plugins.backgroundMode.moveToForeground();
                        } catch (e) {
                            console.log('Move to foreground failed:', e);
                        }
                    }, 100);
                }
                
                // Update notification
                this.updateNotification();
            }
            
            this.onPlaybackStarted(station);
        };
        
        this.audio.onpause = () => {
            console.log('Audio paused');
            this.isPlaying = false;
            this.updateNotification();
        };
        
        this.audio.onerror = (error) => {
            console.error('Audio error:', error, this.audio.error);
            this.isPlaying = false;
            this.onPlaybackError(station);
        };
        
        this.audio.onended = () => {
            console.log('Audio ended - restarting...');
            this.isPlaying = false;
            setTimeout(() => {
                if (this.currentStation === station) {
                    this.playStation(station);
                }
            }, 1000);
        };
        
        this.audio.onstalled = () => {
            console.log('Audio stalled - buffering...');
        };
        
        this.audio.onwaiting = () => {
            console.log('Audio waiting - buffering...');
        };
        
        this.audio.oncanplay = () => {
            console.log('Audio can play');
        };
        
        this.audio.oncanplaythrough = () => {
            console.log('Audio can play through');
        };
        
        // Start playback
        this.audio.play()
            .then(() => {
                console.log('Playback promise resolved');
                
                // Enable background mode after successful play
                setTimeout(() => {
                    if (cordova.plugins && cordova.plugins.backgroundMode) {
                        if (!cordova.plugins.backgroundMode.isEnabled()) {
                            cordova.plugins.backgroundMode.enable();
                        }
                        
                        if (device.platform === 'Android') {
                            cordova.plugins.backgroundMode.moveToForeground();
                        }
                    }
                }, 500);
            })
            .catch(error => {
                console.error('Play failed:', error.name, error.message);
                
                // Handle autoplay restrictions
                if (error.name === 'NotAllowedError') {
                    console.log('Autoplay prevented, user interaction required');
                    this.showToast('Tap play button to start radio', 'info');
                } else {
                    this.onPlaybackError(station);
                }
            });
    }

    play() {
        if (window.appState && window.appState.stations) {
            const stationIndex = window.appState.currentStation || 0;
            const station = window.appState.stations[stationIndex];
            
            if (station) {
                this.playStation(station);
            }
        } else {
            // Initialize and play default station
            this.initializeStations();
            const station = window.appState.stations[0];
            this.playStation(station);
        }
    }

    pause() {
        if (this.audio && this.isPlaying) {
            console.log('Pausing audio');
            this.audio.pause();
            this.isPlaying = false;
            this.updateNotification();
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
                this.playStation(station);
                
                // Update UI
                if (window.updateRadioDisplay) {
                    window.updateRadioDisplay();
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
                this.playStation(station);
                
                // Update UI
                if (window.updateRadioDisplay) {
                    window.updateRadioDisplay();
                }
            }
        }
    }

    updateNotification() {
        console.log('Updating notification, isPlaying:', this.isPlaying);
        
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
                    artist: station.description || 'Gospel Radio',
                    cover: 'icon',
                    isPlaying: this.isPlaying,
                    dismissable: false,
                    hasPrev: true,
                    hasNext: true,
                    ticker: this.isPlaying ? `Playing: ${station.name}` : 'Paused'
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
                        title: 'KLS Radio',
                        icon: 'ic_notification'
                    });
                } else {
                    cordova.plugins.backgroundMode.configure({
                        text: 'Paused - Tap to resume',
                        title: 'KLS Radio',
                        icon: 'ic_notification'
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
        
        // Increment retry count
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            this.showToast(`Reconnecting to ${station.name}... (${this.retryCount}/${this.maxRetries})`, 'warning');
            
            // Try to reconnect after delay
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
            
            // Reset retry count after max retries
            setTimeout(() => {
                this.retryCount = 0;
            }, 10000);
        }
    }

    showToast(message, type = 'info') {
        // Simple toast implementation
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

// Create global instance
window.cordovaAudio = new CordovaBackgroundAudio();

// Add CSS for animations if not already present
if (!document.querySelector('#toast-animations')) {
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
