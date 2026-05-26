#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    const platforms = context.opts.cordova.platforms;
    if (!platforms.includes('android')) return;

    const src = path.join(context.opts.projectRoot, 'assets', 'android', 'res', 'drawable', 'splash.png');
    const destDir = path.join(context.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'drawable');

    if (!fs.existsSync(src)) {
        console.warn('Splash image not found at ' + src);
        return;
    }

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    const dest = path.join(destDir, 'splash.png');
    fs.copyFileSync(src, dest);
    console.log('✅ Splash image copied to ' + dest);
};
