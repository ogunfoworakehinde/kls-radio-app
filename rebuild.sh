#!/bin/bash
echo "=== CLEANING AND REBUILDING ANDROID PROJECT ==="

# Remove platforms
echo "Removing android platform..."
cordova platform remove android

# Remove plugins
echo "Removing all plugins..."
cordova plugin remove cordova-plugin-background-mode
cordova plugin remove cordova-plugin-media
cordova plugin remove cordova-plugin-music-controls2
cordova plugin remove cordova-plugin-android-permissions
cordova plugin remove cordova-plugin-network-information
cordova plugin remove cordova-plugin-splashscreen
cordova plugin remove cordova-plugin-statusbar
cordova plugin remove cordova-plugin-device
cordova plugin remove cordova-plugin-powermanagement
cordova plugin remove cordova-plugin-whitelist
cordova plugin remove cordova-plugin-file

# Remove node_modules and platform folders
echo "Cleaning up directories..."
rm -rf platforms
rm -rf plugins
rm -rf node_modules
rm -rf package-lock.json

# Reinstall
echo "Reinstalling dependencies..."
npm install

# Add platform first
echo "Adding android platform..."
cordova platform add android@13.0.0

# Add plugins one by one
echo "Adding plugins..."
cordova plugin add cordova-plugin-whitelist@1.3.5
cordova plugin add cordova-plugin-file@7.0.0
cordova plugin add cordova-plugin-network-information@3.0.0
cordova plugin add cordova-plugin-device@3.0.0
cordova plugin add cordova-plugin-splashscreen@6.0.1
cordova plugin add cordova-plugin-statusbar@4.0.0
cordova plugin add cordova-plugin-android-permissions@1.1.5
cordova plugin add cordova-plugin-powermanagement@1.0.5
cordova plugin add cordova-plugin-media@5.0.3
cordova plugin add cordova-plugin-music-controls2@3.0.7
cordova plugin add cordova-plugin-background-mode@0.7.3

# Build
echo "Building project..."
cordova build android

echo "=== BUILD COMPLETE ==="
