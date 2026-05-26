package com.kingdomlifestyleradio.klsradio;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

public class KLSMediaControlsPlugin extends CordovaPlugin {
    private CallbackContext eventCallback = null;
    private BroadcastReceiver mediaEventReceiver = null;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("startService")) {
            String track = args.getString(0);
            String artist = args.getString(1);
            boolean isPlaying = args.getBoolean(2);
            startMediaService(track, artist, isPlaying);
            callbackContext.success();
            return true;
        } else if (action.equals("updatePlayPause")) {
            boolean isPlaying = args.getBoolean(0);
            updatePlayPauseButton(isPlaying);
            callbackContext.success();
            return true;
        } else if (action.equals("stopService")) {
            stopMediaService();
            callbackContext.success();
            return true;
        } else if (action.equals("listen")) {
            this.eventCallback = callbackContext;
            registerMediaEventReceiver();
            return true;
        }
        return false;
    }

    private void startMediaService(String track, String artist, boolean isPlaying) {
        Context context = cordova.getActivity().getApplicationContext();
        Intent serviceIntent = new Intent(context, KLSMediaService.class);
        context.startForegroundService(serviceIntent);
    }

    private void updatePlayPauseButton(boolean isPlaying) {
        Context context = cordova.getActivity().getApplicationContext();
        Intent intent = new Intent(context, KLSMediaService.class);
        intent.setAction(isPlaying ? KLSMediaService.ACTION_PLAY : KLSMediaService.ACTION_PAUSE);
        context.startService(intent);
    }

    private void stopMediaService() {
        Context context = cordova.getActivity().getApplicationContext();
        Intent intent = new Intent(context, KLSMediaService.class);
        intent.setAction(KLSMediaService.ACTION_STOP);
        context.startService(intent);
    }

    private void registerMediaEventReceiver() {
        if (mediaEventReceiver != null) return;
        mediaEventReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent.hasExtra("event") && eventCallback != null) {
                    String event = intent.getStringExtra("event");
                    PluginResult result = new PluginResult(PluginResult.Status.OK, event);
                    result.setKeepCallback(true);
                    eventCallback.sendPluginResult(result);
                }
            }
        };
        IntentFilter filter = new IntentFilter("com.klsradio.MEDIA_EVENT");
        cordova.getActivity().registerReceiver(mediaEventReceiver, filter);
    }

    @Override
    public void onDestroy() {
        if (mediaEventReceiver != null) {
            cordova.getActivity().unregisterReceiver(mediaEventReceiver);
        }
        super.onDestroy();
    }
}
