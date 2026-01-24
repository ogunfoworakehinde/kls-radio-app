document.addEventListener('deviceready', () => {
    console.log('Device ready');

    if (window.StatusBar) {
        StatusBar.styleLightContent();
        StatusBar.backgroundColorByHexString('#0a0f2d');
    }
}, false);
