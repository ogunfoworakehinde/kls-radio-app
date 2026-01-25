/**
 * Stream URLs for KLS Radio
 * You can modify these URLs as needed
 */

const KLSRadioStreams = {
    stations: [
        {
            id: 'english',
            name: 'English Gospel',
            url: 'https://s3.voscast.com:9425/stream',
            description: '24/7 English Gospel Music',
            genre: 'Gospel'
        },
        {
            id: 'yoruba',
            name: 'Yoruba Gospel',
            url: 'https://s3.voscast.com:10745/stream',
            description: 'Yoruba Language Worship',
            genre: 'Gospel'
        },
        {
            id: 'praise',
            name: 'Praise Worship',
            url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
            description: 'Contemporary Praise',
            genre: 'Worship'
        }
    ],
    
    // Get station by ID
    getStation: function(id) {
        return this.stations.find(station => station.id === id);
    },
    
    // Get station by index
    getStationByIndex: function(index) {
        return this.stations[index];
    },
    
    // Get all stations
    getAllStations: function() {
        return this.stations;
    },
    
    // Get total number of stations
    getStationCount: function() {
        return this.stations.length;
    }
};

// Export as global
window.KLSRadioStreams = KLSRadioStreams;
