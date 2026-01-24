package com.timetravelers.hackedme;

import android.content.Intent;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.support.v4.media.RatingCompat;
import android.os.Bundle;
import android.util.Log;

public class MediaSessionCallback extends MediaSessionCompat.Callback {

    private static final String TAG = "MediaSessionCallback";

    @Override
    public void onPlay() {
        Log.d(TAG, "onPlay called");
        // Call your Cordova plugin method to resume playback
        BackgroundAudioBridge.play();
    }

    @Override
    public void onPause() {
        Log.d(TAG, "onPause called");
        // Call your Cordova plugin method to pause playback
        BackgroundAudioBridge.pause();
    }

    @Override
    public void onStop() {
        Log.d(TAG, "onStop called");
        // Call your Cordova plugin method to stop playback
        BackgroundAudioBridge.stop();
    }

    @Override
    public void onSeekTo(long pos) {
        Log.d(TAG, "onSeekTo called: " + pos);
        // Optionally implement if your stream supports seeking
    }

    @Override
    public void onSkipToNext() {
        Log.d(TAG, "onSkipToNext called");
        // Optionally implement if you have multiple streams
        BackgroundAudioBridge.skipNext();
    }

    @Override
    public void onSkipToPrevious() {
        Log.d(TAG, "onSkipToPrevious called");
        // Optionally implement if you have multiple streams
        BackgroundAudioBridge.skipPrevious();
    }

    @Override
    public boolean onMediaButtonEvent(Intent mediaButtonIntent) {
        Log.d(TAG, "onMediaButtonEvent called");
        // Let the default handler process the media button
        return super.onMediaButtonEvent(mediaButtonIntent);
    }
}
