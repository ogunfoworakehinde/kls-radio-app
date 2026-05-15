// js/streams.js - Radio Stream Management

class RadioStreamManager {
    constructor() {
        this.stations = [
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
        
        this.currentStationIndex = 0;
        this.isPlaying = false;
        this.volume = 1.0;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 3000;
        
        this.init();
    }

    init() {
        document.addEventListener('deviceready', () => {
            console.log('RadioStreamManager: Device ready');
            this.setupNetworkListeners();
        }, false);
    }

    setupNetworkListeners() {
        if (navigator.connection) {
            navigator.connection.addEventListener('change', this.handleNetworkChange.bind(this));
        }
    }

    handleNetworkChange() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            const type = connection.type;
            console.log('Network type changed to:', type);
            
            // If we regain connection and were playing, try to reconnect
            if (type !== 'none' && this.isPlaying) {
                setTimeout(() => {
                    this.playCurrentStation();
                }, 1000);
            }
        }
    }

    getCurrentStation() {
        return this.stations[this.currentStationIndex];
    }

    getStations() {
        return this.stations;
    }

    setStation(index) {
        if (index >= 0 && index < this.stations.length) {
            this.currentStationIndex = index;
            
            // If currently playing, switch to new station
            if (this.isPlaying) {
                this.playCurrentStation();
            }
            
            return true;
        }
        return false;
    }

    nextStation() {
        this.currentStationIndex = (this.currentStationIndex + 1) % this.stations.length;
        
        if (this.isPlaying) {
            this.playCurrentStation();
        }
        
        return this.getCurrentStation();
    }

    previousStation() {
        this.currentStationIndex = (this.currentStationIndex - 1 + this.stations.length) % this.stations.length;
        
        if (this.isPlaying) {
            this.playCurrentStation();
        }
        
        return this.getCurrentStation();
    }

    playCurrentStation() {
        const station = this.getCurrentStation();
        
        if (!station) {
            console.error('No station selected');
            return;
        }

        // Use BackgroundAudioManager if available
        if (window.BackgroundAudioManager) {
            window.BackgroundAudioManager.playStation(station);
            this.isPlaying = true;
            this.retryCount = 0;
            this.onPlaybackStarted(station);
            return;
        }

        // Fallback to HTML5 audio
        this.playWithHTML5(station);
    }

    playWithHTML5(station) {
        try {
            // Create or get audio element
            let audio = document.getElementById('radioAudio');
            if (!audio) {
                audio = new Audio();
                audio.id = 'radioAudio';
                audio.crossOrigin = 'anonymous';
                document.body.appendChild(audio);
            }

            // Set up event listeners
            audio.onplaying = () => {
                this.isPlaying = true;
                this.retryCount = 0;
                this.onPlaybackStarted(station);
            };

            audio.onerror = (e) => {
                console.error('Audio error:', e);
                this.handlePlaybackError(station);
            };

            audio.onended = () => {
                console.log('Audio ended, restarting...');
                setTimeout(() => this.playCurrentStation(), 1000);
            };

            audio.onstalled = () => {
                console.log('Audio stalled, attempting to recover...');
                setTimeout(() => {
                    if (this.isPlaying) {
                        audio.play().catch(e => console.error('Recovery failed:', e));
                    }
                }, 2000);
            };

            // Set source and play
            audio.volume = this.volume;
            audio.src = station.url;
            audio.load();
            
            audio.play()
                .then(() => {
                    console.log('HTML5 playback started');
                })
                .catch(error => {
                    console.error('HTML5 play failed:', error);
                    this.handlePlaybackError(station);
                });

        } catch (error) {
            console.error('HTML5 playback setup error:', error);
            this.handlePlaybackError(station);
        }
    }

    handlePlaybackError(station) {
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            console.log(`Retrying playback (${this.retryCount}/${this.maxRetries})...`);
            
            // Exponential backoff
            const delay = this.retryDelay * Math.pow(1.5, this.retryCount - 1);
            
            setTimeout(() => {
                if (this.isPlaying) {
                    this.playCurrentStation();
                }
            }, delay);
        } else {
            console.error('Max retries reached, stopping playback');
            this.stop();
            this.onPlaybackError(station);
        }
    }

    onPlaybackStarted(station) {
        // Update UI
        if (window.updateRadioDisplay) {
            window.updateRadioDisplay();
        }
        
        // Update notification
        if (window.BackgroundAudioManager) {
            window.BackgroundAudioManager.updateNotification();
        }
        
        // Dispatch custom event
        const event = new CustomEvent('radiostart', { detail: station });
        document.dispatchEvent(event);
    }

    onPlaybackError(station) {
        // Dispatch custom event
        const event = new CustomEvent('radioerror', { 
            detail: { station: station, retryCount: this.retryCount }
        });
        document.dispatchEvent(event);
    }

    play() {
        if (!this.isPlaying) {
            this.playCurrentStation();
        }
    }

    pause() {
        this.isPlaying = false;
        
        if (window.BackgroundAudioManager) {
            window.BackgroundAudioManager.pause();
        } else {
            const audio = document.getElementById('radioAudio');
            if (audio) {
                audio.pause();
            }
        }
        
        // Dispatch event
        const event = new CustomEvent('radiopause');
        document.dispatchEvent(event);
    }

    stop() {
        this.isPlaying = false;
        this.retryCount = 0;
        
        if (window.BackgroundAudioManager) {
            window.BackgroundAudioManager.stop();
        } else {
            const audio = document.getElementById('radioAudio');
            if (audio) {
                audio.pause();
                audio.src = '';
            }
        }
        
        // Dispatch event
        const event = new CustomEvent('radiostop');
        document.dispatchEvent(event);
    }

    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        
        if (window.BackgroundAudioManager) {
            window.BackgroundAudioManager.setVolume(this.volume);
        } else {
            const audio = document.getElementById('radioAudio');
            if (audio) {
                audio.volume = this.volume;
            }
        }
    }

    getVolume() {
        return this.volume;
    }

    getIsPlaying() {
        return this.isPlaying;
    }

    getCurrentStationIndex() {
        return this.currentStationIndex;
    }
}

// Create global instance
window.RadioStreamManager = new RadioStreamManager();
