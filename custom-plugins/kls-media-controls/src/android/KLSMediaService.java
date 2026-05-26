package com.kingdomlifestyleradio.klsradio;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class KLSMediaService extends Service {
    private static final String CHANNEL_ID = "kls_media_playback";
    private static final int NOTIFICATION_ID = 1;
    public static final String ACTION_PLAY = "com.klsradio.PLAY";
    public static final String ACTION_PAUSE = "com.klsradio.PAUSE";
    public static final String ACTION_STOP = "com.klsradio.STOP";
    public static final String ACTION_NEXT = "com.klsradio.NEXT";
    public static final String ACTION_PREV = "com.klsradio.PREV";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            handleAction(intent.getAction());
        }
        return START_STICKY;
    }

    private void handleAction(String action) {
        Intent broadcastIntent = new Intent();
        broadcastIntent.setAction("com.klsradio.MEDIA_EVENT");
        switch (action) {
            case ACTION_PLAY:
                broadcastIntent.putExtra("event", "play");
                break;
            case ACTION_PAUSE:
                broadcastIntent.putExtra("event", "pause");
                break;
            case ACTION_STOP:
                broadcastIntent.putExtra("event", "stop");
                stopForeground(true);
                stopSelf();
                return;
            case ACTION_NEXT:
                broadcastIntent.putExtra("event", "next");
                break;
            case ACTION_PREV:
                broadcastIntent.putExtra("event", "previous");
                break;
        }
        sendBroadcast(broadcastIntent);
    }

    public void showNotification(String track, String artist, boolean isPlaying) {
        Intent openAppIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, openAppIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(track)
                .setContentText(artist)
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                        .setShowActionsInCompactView(0, 1, 2));

        // Add play/pause button
        int playPauseIcon = isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play;
        String playPauseAction = isPlaying ? ACTION_PAUSE : ACTION_PLAY;
        builder.addAction(playPauseIcon, isPlaying ? "Pause" : "Play",
                PendingIntent.getService(this, 0, new Intent(this, KLSMediaService.class).setAction(playPauseAction),
                        PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));

        // Add next button
        builder.addAction(android.R.drawable.ic_media_next, "Next",
                PendingIntent.getService(this, 0, new Intent(this, KLSMediaService.class).setAction(ACTION_NEXT),
                        PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));

        // Add stop button
        builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop",
                PendingIntent.getService(this, 0, new Intent(this, KLSMediaService.class).setAction(ACTION_STOP),
                        PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));

        Notification notification = builder.build();
        startForeground(NOTIFICATION_ID, notification);
    }

    public void updatePlayPause(boolean isPlaying) {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Kingdom Lifestyle Radio")
                .setContentText("Live Stream")
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW);

        int playPauseIcon = isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play;
        String playPauseAction = isPlaying ? ACTION_PAUSE : ACTION_PLAY;
        builder.addAction(playPauseIcon, isPlaying ? "Pause" : "Play",
                PendingIntent.getService(this, 0, new Intent(this, KLSMediaService.class).setAction(playPauseAction),
                        PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));

        manager.notify(NOTIFICATION_ID, builder.build());
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "KLS Radio Playback",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Media playback controls for Kingdom Lifestyle Radio");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
