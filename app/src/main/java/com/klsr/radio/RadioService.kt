package com.kingdomlifestyleradio.klsradio

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaStyleNotificationHelper

class RadioService : Service() {
    private lateinit var player: ExoPlayer
    private lateinit var mediaSession: MediaSession
    private var stationIndex = 0

    companion object {
        const val CHANNEL_ID = "radio"
        const val NOTIFY_ID = 101
        const val ACTION_PLAY_PAUSE = "com.kingdomlifestyleradio.klsradio.PLAY_PAUSE"
        const val ACTION_STOP = "com.kingdomlifestyleradio.klsradio.STOP"
        const val ACTION_NEXT = "com.kingdomlifestyleradio.klsradio.NEXT"
        const val ACTION_PREV = "com.kingdomlifestyleradio.klsradio.PREV"
        const val EXTRA_STATION_INDEX = "station_index"
        val STATIONS = arrayOf(
            Station("English Gospel", "https://s3.voscast.com:9425/stream", "24/7 English Gospel Music"),
            Station("Yoruba Gospel", "https://s3.voscast.com:10745/stream", "Yoruba Language Worship"),
            Station("Praise Worship", "https://stream.zeno.fm/f3wvbbqmdg8uv", "Contemporary Praise")
        )
    }

    data class Station(val name: String, val url: String, val desc: String)

    override fun onCreate() {
        super.onCreate()
        createChannel()
        player = ExoPlayer.Builder(this).build()
        mediaSession = MediaSession.Builder(this, player).build()
        playStation(stationIndex)
    }

    private fun playStation(index: Int) {
        stationIndex = index
        player.setMediaItem(MediaItem.fromUri(STATIONS[index].url))
        player.prepare()
        player.playWhenReady = true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_PLAY_PAUSE -> {
                if (player.isPlaying) player.pause() else player.play()
            }
            ACTION_STOP -> {
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_NEXT -> {
                stationIndex = (stationIndex + 1) % STATIONS.size
                playStation(stationIndex)
            }
            ACTION_PREV -> {
                stationIndex = if (stationIndex == 0) STATIONS.size - 1 else stationIndex - 1
                playStation(stationIndex)
            }
            else -> {
                intent?.getIntExtra(EXTRA_STATION_INDEX, -1)?.let { idx ->
                    if (idx in STATIONS.indices && idx != stationIndex) {
                        playStation(idx)
                    }
                }
            }
        }
        startForeground(NOTIFY_ID, buildNotification())
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        mediaSession.release()
        player.release()
        super.onDestroy()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val chan = NotificationChannel(CHANNEL_ID, "Radio", NotificationManager.IMPORTANCE_LOW)
            getSystemService(NotificationManager::class.java).createNotificationChannel(chan)
        }
    }

    private fun buildNotification(): Notification {
        val s = STATIONS[stationIndex]
        val openIntent = PendingIntent.getActivity(this, 0,
            Intent(this, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        // Play/Pause action
        val ppIcon = if (player.isPlaying) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play
        val ppAction = NotificationCompat.Action(ppIcon,
            if (player.isPlaying) "Pause" else "Play",
            PendingIntent.getService(this, 0,
                Intent(this, RadioService::class.java).apply { action = ACTION_PLAY_PAUSE },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))

        // Previous action
        val prevAction = NotificationCompat.Action(
            android.R.drawable.ic_media_previous, "Previous",
            PendingIntent.getService(this, 2,
                Intent(this, RadioService::class.java).apply { action = ACTION_PREV },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))

        // Next action
        val nextAction = NotificationCompat.Action(
            android.R.drawable.ic_media_next, "Next",
            PendingIntent.getService(this, 3,
                Intent(this, RadioService::class.java).apply { action = ACTION_NEXT },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))

        // Cancel (stop) action
        val stopAction = NotificationCompat.Action(
            android.R.drawable.ic_menu_close_clear_cancel, "Cancel",
            PendingIntent.getService(this, 1,
                Intent(this, RadioService::class.java).apply { action = ACTION_STOP },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(s.name)
            .setContentText(s.desc)
            .setContentIntent(openIntent)
            .setOngoing(player.isPlaying)
            .addAction(stopAction)
            .addAction(prevAction)
            .addAction(ppAction)
            .addAction(nextAction)
            .setStyle(
                MediaStyleNotificationHelper.MediaStyle(mediaSession)
                    .setShowActionsInCompactView(1, 2, 3) // prev, play/pause, next
            )
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
    }
}
