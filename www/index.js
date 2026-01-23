/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    onDeviceReady: function() {
        console.log('🚀 KLS Radio App Started');
        console.log('Platform:', device.platform);
        console.log('Version:', device.version);
        console.log('UUID:', device.uuid);
        
        // Initialize network information
        if (navigator.connection) {
            console.log('Connection type:', navigator.connection.type);
            console.log('Connection effective type:', navigator.connection.effectiveType);
        }
        
        // Handle pause/resume events
        document.addEventListener('pause', this.onPause.bind(this), false);
        document.addEventListener('resume', this.onResume.bind(this), false);
        
        // Handle back button on Android
        document.addEventListener('backbutton', this.onBackButton.bind(this), false);
        
        // Initialize your main app
        if (typeof initMainApp === 'function') {
            initMainApp();
        }
    },

    onPause: function() {
        console.log('⏸️ App paused');
        // Handle app pause (user pressed home button, etc.)
    },

    onResume: function() {
        console.log('▶️ App resumed');
        // Handle app resume
    },

    onBackButton: function(e) {
        console.log('🔙 Back button pressed');
        e.preventDefault();
        
        // Custom back button behavior
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // If no history, show confirmation before exit
            if (confirm('Exit KLS Radio?')) {
                navigator.app.exitApp();
            }
        }
    }
};

// Initialize the app
app.initialize();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = app;
}
