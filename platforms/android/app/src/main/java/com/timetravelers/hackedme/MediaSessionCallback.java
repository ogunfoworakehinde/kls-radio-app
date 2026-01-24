package com.timetravelers.hackedme;

import android.content.Intent;
import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.media.session.MediaButtonReceiver;
import androidx.media.session.MediaSessionCompat;
import androidx.media.session.PlaybackStateCompat;
import androidx.media.session.MediaSessionCompat.Callback;

public class MediaSessionCallback extends MediaSessionCompat.Callback {

    @Override
    public void onPlay() {
        super.onPlay();
        // TODO: call your background audio play function
    }

    @Override
    public void onPause() {
        super.onPause();
        // TODO: call your background audio pause function
    }

    @Override
    public void onSkipToNext() {
        super.onSkipToNext();
        // TODO: implement skip to next if you have multiple streams
    }

    @Override
    public void onSkipToPrevious() {
        super.onSkipToPrevious();
        // TODO: implement skip to previous if you have multiple streams
    }

    @Override
    public void onSeekTo(long pos) {
        super.onSeekTo(pos);
        // TODO: implement seek for your stream
    }

    @Override
    public boolean onMediaButtonEvent(@NonNull Intent mediaButtonIntent) {
        return super.onMediaButtonEvent(mediaButtonIntent);
    }
}
