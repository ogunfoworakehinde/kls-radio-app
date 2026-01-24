// Background Audio Service for Cordova Android App
document.addEventListener('deviceready', onDeviceReady, false);

let backgroundMode = null;
let media = null;
let isPlaying = false;
let currentStreamUrl = '';

function onDeviceReady() {
    console.log('Cordova device ready, initializing background audio...');
    
    // Initialize Status Bar
    if (window.StatusBar) {
        StatusBar.overlaysWebView(false);
        StatusBar.backgroundColorByHexString("#0a0f2d");
        StatusBar.styleLightContent();
    }
    
    // Initialize Splash Screen
    if (window.navigator.splashscreen) {
        setTimeout(() => {
            navigator.splashscreen.hide();
        }, 2000);
    }
    
    // Initialize background mode
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.backgroundMode) {
        backgroundMode = cordova.plugins.backgroundMode;
        
        // Configure background mode
        backgroundMode.enable();
        backgroundMode.setDefaults({
            title: 'KLS Radio',
            text: 'Playing Kingdom Lifestyle Radio',
            icon: 'icon',
            color: '0a0f2d',
            resume: true,
            hidden: false,
            bigText: true,
            channelName: 'KLS Radio Player',
            channelDescription: 'Background audio playback',
            importance: 4, // IMPORTANCE_HIGH
            allowClose: false,
            silent: false
        });
        
        // Event listeners for background mode
        backgroundMode.on('activate', function() {
            console.log('Background mode activated');
            backgroundMode.disableWebViewOptimizations();
            backgroundMode.disableBatteryOptimizations();
            
            // Update notification
            backgroundMode.configure({
                text: 'Playing in background'
            });
        });
        
        backgroundMode.on('deactivate', function() {
            console.log('Background mode deactivated');
        });
        
        backgroundMode.on('failure', function(errorCode) {
            console.log('Background mode failed:', errorCode);
        });
        
        console.log('Background mode plugin initialized');
    } else {
        console.log('Background mode plugin not available');
    }
    
    // Request Android permissions
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.permissions) {
        const permissions = cordova.plugins.permissions;
        
        const permissionList = [
            permissions.ACCESS_NETWORK_STATE,
            permissions.INTERNET,
            permissions.WAKE_LOCK,
            permissions.FOREGROUND_SERVICE
        ];
        
        permissions.requestPermissions(permissionList, 
            function(success) {
                console.log('Android permissions granted');
            },
            function(error) {
                console.log('Android permissions error:', error);
            }
        );
    }
    
    // Initialize media plugin
    if (window.Media) {
        console.log('Media plugin available');
    } else {
        console.log('Media plugin not available');
    }
}

// Background Audio Functions
function initBackgroundAudio(streamUrl, onSuccess, onError, onStatus) {
    if (!window.Media) {
        console.log('Media plugin not available for background audio');
        if (onError) onError({ code: 0, message: 'Media plugin not available' });
        return null;
    }
    
    currentStreamUrl = streamUrl;
    
    try {
        // Create media instance with proper options for background playback
        media = new Media(
            streamUrl,
            function() {
                console.log('Media playback completed');
                if (onSuccess) onSuccess();
            },
            function(error) {
                console.log('Media error:', error);
                if (onError) onError(error);
                
                // Auto-retry on error
                if (isPlaying) {
                    setTimeout(() => {
                        if (media) {
                            media.play();
                        }
                    }, 3000);
                }
            },
            function(status) {
                console.log('Media status:', status);
                if (onStatus) onStatus(status);
                
                switch(status) {
                    case Media.MEDIA_STARTING:
                        console.log('Media starting...');
                        break;
                    case Media.MEDIA_RUNNING:
                        console.log('Media running');
                        if (backgroundMode && !backgroundMode.isActive()) {
                            backgroundMode.enable();
                        }
                        break;
                    case Media.MEDIA_PAUSED:
                        console.log('Media paused');
                        break;
                    case Media.MEDIA_STOPPED:
                        console.log('Media stopped');
                        break;
                    case Media.MEDIA_NONE:
                        console.log('Media none');
                        break;
                }
            }
        );
        
        // Set volume to maximum
        if (media.setVolume) {
            media.setVolume('1.0');
        }
        
        console.log('Background audio initialized for:', streamUrl);
        return media;
        
    } catch (error) {
        console.log('Error initializing background audio:', error);
        if (onError) onError(error);
        return null;
    }
}

function playBackgroundAudio(streamUrl) {
    console.log('playBackgroundAudio called for:', streamUrl);
    
    if (!media || currentStreamUrl !== streamUrl) {
        console.log('Initializing new background audio...');
        media = initBackgroundAudio(
            streamUrl,
            function() {
                console.log('Background audio playback completed');
            },
            function(error) {
                console.log('Background audio error:', error);
            },
            function(status) {
                console.log('Background audio status:', status);
            }
        );
    }
    
    if (media) {
        try {
            media.play();
            isPlaying = true;
            
            // Enable background mode
            if (backgroundMode) {
                if (!backgroundMode.isEnabled()) {
                    backgroundMode.enable();
                }
                backgroundMode.configure({
                    text: 'Playing: Kingdom Lifestyle Radio',
                    ticker: 'KLS Radio is playing'
                });
            }
            
            console.log('Background audio started successfully');
            return true;
        } catch (error) {
            console.log('Error playing background audio:', error);
            return false;
        }
    }
    
    return false;
}

function pauseBackgroundAudio() {
    console.log('pauseBackgroundAudio called');
    
    if (media && isPlaying) {
        try {
            media.pause();
            isPlaying = false;
            
            if (backgroundMode) {
                backgroundMode.configure({
                    text: 'KLS Radio - Paused'
                });
            }
            
            console.log('Background audio paused');
            return true;
        } catch (error) {
            console.log('Error pausing background audio:', error);
            return false;
        }
    }
    
    return false;
}

function stopBackgroundAudio() {
    console.log('stopBackgroundAudio called');
    
    if (media) {
        try {
            media.stop();
            media.release();
            media = null;
            isPlaying = false;
            currentStreamUrl = '';
            
            if (backgroundMode) {
                backgroundMode.disable();
            }
            
            console.log('Background audio stopped');
            return true;
        } catch (error) {
            console.log('Error stopping background audio:', error);
            return false;
        }
    }
    
    return false;
}

function setBackgroundAudioVolume(volume) {
    if (media && media.setVolume) {
        try {
            media.setVolume(volume.toString());
            console.log('Background audio volume set to:', volume);
            return true;
        } catch (error) {
            console.log('Error setting volume:', error);
            return false;
        }
    }
    return false;
}

function getCurrentPlaybackTime() {
    if (media && media.getCurrentPosition) {
        return new Promise((resolve) => {
            media.getCurrentPosition(resolve);
        });
    }
    return Promise.resolve(0);
}

function getDuration() {
    if (media && media.getDuration) {
        return new Promise((resolve) => {
            media.getDuration(resolve);
        });
    }
    return Promise.resolve(0);
}

// Export functions to window
window.BackgroundAudio = {
    init: initBackgroundAudio,
    play: playBackgroundAudio,
    pause: pauseBackgroundAudio,
    stop: stopBackgroundAudio,
    setVolume: setBackgroundAudioVolume,
    getCurrentTime: getCurrentPlaybackTime,
    getDuration: getDuration,
    isPlaying: () => isPlaying,
    getCurrentUrl: () => currentStreamUrl,
    enableBackgroundMode: function() {
        if (backgroundMode) {
            backgroundMode.enable();
            return true;
        }
        return false;
    },
    disableBackgroundMode: function() {
        if (backgroundMode) {
            backgroundMode.disable();
            return true;
        }
        return false;
    },
    isBackgroundModeActive: function() {
        return backgroundMode ? backgroundMode.isActive() : false;
    }
};
