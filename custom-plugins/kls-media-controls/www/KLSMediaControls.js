var exec = require('cordova/exec');

var KLSMediaControls = {
    startService: function(track, artist, isPlaying, success, error) {
        exec(success, error, 'KLSMediaControls', 'startService', [track, artist, isPlaying]);
    },
    updatePlayPause: function(isPlaying, success, error) {
        exec(success, error, 'KLSMediaControls', 'updatePlayPause', [isPlaying]);
    },
    stopService: function(success, error) {
        exec(success, error, 'KLSMediaControls', 'stopService', []);
    },
    listen: function(callback) {
        exec(callback, function(){}, 'KLSMediaControls', 'listen', []);
    }
};

module.exports = KLSMediaControls;
