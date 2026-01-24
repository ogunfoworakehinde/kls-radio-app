document.addEventListener('deviceready', () => {
    console.log('App initialized');

    const streamList = document.getElementById('streamList');
    if (!streamList) return;

    // Render list of streams
    STREAMS.forEach((stream, index) => {
        const li = document.createElement('li');
        li.textContent = `${stream.name} - ${stream.description}`;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            BackgroundAudio.play(stream.url);
        });
        streamList.appendChild(li);
    });

    // Auto-play first stream
    if (STREAMS.length > 0) BackgroundAudio.play(STREAMS[0].url);
});
