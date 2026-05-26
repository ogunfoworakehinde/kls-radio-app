#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    const platforms = context.opts.cordova.platforms;
    if (!platforms.includes('android')) return;

    const src = path.join(context.opts.projectRoot, 'assets', 'android', 'res', 'drawable', 'splash.png');
    if (!fs.existsSync(src)) {
        console.warn('❌ Splash image not found at ' + src);
        return;
    }

    const baseDest = path.join(context.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res');
    const subdirs = ['drawable', 'drawable-hdpi', 'drawable-xhdpi', 'drawable-xxhdpi'];

    subdirs.forEach(sub => {
        const destDir = path.join(baseDest, sub);
        fs.mkdirSync(destDir, { recursive: true });
        const dest = path.join(destDir, 'splash.png');
        fs.copyFileSync(src, dest);
        console.log('✅ Copied splash to ' + dest);
    });
};
