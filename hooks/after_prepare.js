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
    
    // Copy to all mipmap folders as launcher icon (this changes the app icon and splash icon)
    const mipmaps = ['mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
    mipmaps.forEach(dir => {
        const destDir = path.join(baseDest, dir);
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, path.join(destDir, 'ic_launcher.png'));
        fs.copyFileSync(src, path.join(destDir, 'ic_launcher_round.png'));
        console.log('✅ Copied to ' + destDir);
    });
    
    // Also copy to drawable folders as a fallback
    const drawables = ['drawable', 'drawable-hdpi', 'drawable-xhdpi', 'drawable-xxhdpi'];
    drawables.forEach(dir => {
        const destDir = path.join(baseDest, dir);
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, path.join(destDir, 'splash.png'));
    });
    console.log('✅ Custom launcher icons and splash drawables applied');
};
