package com.timetravelers.hackedme;

import android.content.Intent;
import android.os.Bundle;
import android.view.KeyEvent;

import androidx.media.session.MediaSessionCompat;
import androidx.media.RatingCompat;

import org.apache.cordova.CallbackContext;

public class MediaSessionCallback extends MediaSessionCompat.Callback {

  private CallbackContext cb;

  public void setCallback(CallbackContext cb) {
    this.cb = cb;
  }

  @Override
  public void onPlay() {
    if (this.cb != null) {
      this.cb.success("{\"message\":\"music-controls-media-button-play\"}");
      this.cb = null;
    }
  }

  @Override
  public void onPrepare() {
    if (this.cb != null) {
      this.cb.success("{\"message\":\"on-prepare\"}");
      this.cb = null;
    }
  }

  @Override
  public void onPause() {
    if (this.cb != null) {
      this.cb.success("{\"message\":\"music-controls-media-button-pause\"}");
      this.cb = null;
    }
  }

  @Override
  public void onStop() {
    if (this.cb != null) {
      this.cb.success("{\"message\":\"music-controls-media-button-stop\"}");
      this.cb = null;
    }
  }

  @Override
  public void onSkipToNext() {
    if (this.cb != null) {
      this.cb.success("{\"message\":\"music-controls-media-button-next\"}");
      this.cb = null;
    }
  }

  @Override
  public void onSkipToPrevious() {
    if (this.cb != null) {
      this.cb.success("{\"message\":\"music-controls-media-button-previous\"}");
      this.cb = null;
    }
  }

  @Override
  public void onSeekTo(long position) {
    if (this.cb != null) {
      this.cb.success("{\"message\":\"seek-to\",\"position\":\"" + position + "\"}");
      this.cb = null;
    }
  }

  @Override
  public void onPlayFromSearch(String query, Bundle extras) {
    if (this.cb != null) {
      this.cb.success("{\"message\":\"play-from-search\",\"query\":\"" + query + "\"}");
      this.cb = null;
    }
  }

  @Override
  public void onPrepareFromSearch(String query, Bundle extras) {
    if (this.cb != null) {
      this.cb.success("{\"message\":\"prepare-from-search\",\"query\":\"" + query + "\"}");
      this.cb = null;
    }
  }

  @Override
  public void onSetRating(RatingCompat rating) {
    if (this.cb != null) {
      this.cb.success("{\"message\":\"set-rating\",\"rating\":\"" + rating + "\"}");
      this.cb = null;
    }
  }

  @Override
  public boolean onMediaButtonEvent(Intent mediaButtonIntent) {
    if (mediaButtonIntent == null || mediaButtonIntent.getExtras() == null) {
      return false;
    }

    KeyEvent event =
      (KeyEvent) mediaButtonIntent.getExtras().get(Intent.EXTRA_KEY_EVENT);

    if (event == null || event.getAction() != KeyEvent.ACTION_DOWN) {
      return false;
    }

    if (this.cb == null) {
      return true;
    }

    switch (event.getKeyCode()) {
      case KeyEvent.KEYCODE_MEDIA_PLAY:
        cb.success("{\"message\":\"music-controls-media-button-play\"}");
        break;
      case KeyEvent.KEYCODE_MEDIA_PAUSE:
        cb.success("{\"message\":\"music-controls-media-button-pause\"}");
        break;
      case KeyEvent.KEYCODE_MEDIA_NEXT:
        cb.success("{\"message\":\"music-controls-media-button-next\"}");
        break;
      case KeyEvent.KEYCODE_MEDIA_PREVIOUS:
        cb.success("{\"message\":\"music-controls-media-button-previous\"}");
        break;
      case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
        cb.success("{\"message\":\"music-controls-media-button-play-pause\"}");
        break;
      case KeyEvent.KEYCODE_MEDIA_STOP:
        cb.success("{\"message\":\"music-controls-media-button-stop\"}");
        break;
      case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
        cb.success("{\"message\":\"music-controls-media-button-forward\"}");
        break;
      case KeyEvent.KEYCODE_MEDIA_REWIND:
        cb.success("{\"message\":\"music-controls-media-button-rewind\"}");
        break;
      default:
        cb.success("{\"message\":\"music-controls-media-button-unknown-" + event.getKeyCode() + "\"}");
        break;
    }

    cb = null;
    return true;
  }
}
