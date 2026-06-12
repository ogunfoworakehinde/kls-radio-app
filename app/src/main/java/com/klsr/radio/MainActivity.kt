package com.kingdomlifestyleradio.klsradio

import android.Manifest
import android.content.ComponentName
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.PopupMenu
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import androidx.navigation.NavController
import androidx.navigation.fragment.NavHostFragment
import com.google.common.util.concurrent.MoreExecutors
import com.kingdomlifestyleradio.klsradio.databinding.ActivityMainBinding
import com.kingdomlifestyleradio.klsradio.ui.ChannelSwitcherFragment

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var navController: NavController
    private var mediaController: MediaController? = null
    private var currentStation = 0
    private var isPlaying = false
    private lateinit var prefs: SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayShowTitleEnabled(false)

        prefs = getSharedPreferences("settings", MODE_PRIVATE)

        // Notification permission
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED)
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1001)
        }

        // NavController
        val navHostFragment = supportFragmentManager.findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        navController = navHostFragment.navController
        setupCustomBottomNav()

        binding.btnSettings.setOnClickListener { navController.navigate(R.id.settingsFragment) }

        // Connect to MediaController
        try {
            val token = SessionToken(this, ComponentName(this, RadioService::class.java))
            val future = MediaController.Builder(this, token).buildAsync()
            future.addListener({
                try {
                    mediaController = future.get()
                    mediaController?.addListener(PlayerListener())
                    isPlaying = mediaController?.isPlaying ?: false
                    updatePlayPauseIcon()
                    updatePlayerBar()
                } catch (e: Exception) { Log.e("MainActivity", "MC get failed", e) }
            }, MoreExecutors.directExecutor())
        } catch (e: Exception) { Log.e("MainActivity", "SessionToken failed", e) }

        // ----- Auto‑play feature -----
        val autoPlay = prefs.getBoolean("auto_play", true)
        if (autoPlay) {
            // Start the radio service if not already running
            val intent = Intent(this, RadioService::class.java).apply {
                putExtra(RadioService.EXTRA_STATION_INDEX, currentStation)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                startForegroundService(intent)
            else
                startService(intent)
            // Assume it will start playing; the listener will update the icon later
            isPlaying = true
            updatePlayPauseIcon()
        }

        // Player bar buttons
        binding.playerBar.btnPlayPause.setOnClickListener {
            val intent = Intent(this, RadioService::class.java).apply {
                action = RadioService.ACTION_PLAY_PAUSE
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                startForegroundService(intent)
            else
                startService(intent)
            isPlaying = !isPlaying
            updatePlayPauseIcon()
        }
        binding.playerBar.btnPrev.setOnClickListener { switchStation(-1) }
        binding.playerBar.btnNext.setOnClickListener { switchStation(1) }
        binding.playerBar.btnChannelSwitcher.setOnClickListener {
            val bottomSheet = ChannelSwitcherFragment()
            bottomSheet.show(supportFragmentManager, "ChannelSwitcher")
            supportFragmentManager.setFragmentResultListener(
                ChannelSwitcherFragment.REQUEST_KEY, this
            ) { _, bundle ->
                val index = bundle.getInt(ChannelSwitcherFragment.RESULT_INDEX, -1)
                if (index != -1 && index != currentStation)
                    switchStation(index - currentStation)
            }
        }
    }

    private fun setupCustomBottomNav() { /* unchanged */ 
        val buttonMap = mapOf(
            R.id.nav_home to R.id.homeFragment,
            R.id.nav_podcast to R.id.podcastFragment,
            R.id.nav_prayer to R.id.prayerFragment,
            R.id.nav_blog to R.id.blogFragment
        )
        buttonMap.forEach { (btnId, destId) ->
            findViewById<Button>(btnId).setOnClickListener {
                navController.navigate(destId, null,
                    androidx.navigation.NavOptions.Builder()
                        .setPopUpTo(navController.graph.startDestinationId, false)
                        .setLaunchSingleTop(true).build())
            }
        }
        findViewById<Button>(R.id.nav_more).setOnClickListener { view ->
            val popup = PopupMenu(this, view)
            popup.menuInflater.inflate(R.menu.more_popup_menu, popup.menu)
            popup.setOnMenuItemClickListener { item ->
                when (item.itemId) {
                    R.id.action_about -> navController.navigate(R.id.aboutFragment)
                    R.id.action_donate -> navController.navigate(R.id.donationFragment)
                    R.id.action_contact -> navController.navigate(R.id.contactFragment)
                    R.id.action_settings -> navController.navigate(R.id.settingsFragment)
                }
                true
            }
            popup.show()
        }
        navController.addOnDestinationChangedListener { _, destination, _ ->
            buttonMap.entries.forEach { (btnId, destId) ->
                findViewById<Button>(btnId).isSelected = (destination.id == destId)
            }
            val moreDestinations = listOf(R.id.aboutFragment, R.id.donationFragment, R.id.contactFragment, R.id.settingsFragment)
            findViewById<Button>(R.id.nav_more).isSelected = moreDestinations.contains(destination.id)
        }
    }

    private fun switchStation(delta: Int) {
        currentStation = (currentStation + delta + RadioService.STATIONS.size) % RadioService.STATIONS.size
        val i = Intent(this, RadioService::class.java).apply {
            putExtra(RadioService.EXTRA_STATION_INDEX, currentStation)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(i) else startService(i)
        updatePlayerBar()
    }

    private fun updatePlayerBar(mc: MediaController? = mediaController) {
        val s = RadioService.STATIONS[currentStation]
        binding.playerBar.stationName.text = s.name
        binding.playerBar.stationDesc.text = s.desc
        updatePlayPauseIcon()
    }

    private fun updatePlayPauseIcon() {
        val icon = if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play_arrow
        binding.playerBar.btnPlayPause.setImageResource(icon)
    }

    inner class PlayerListener : Player.Listener {
        override fun onIsPlayingChanged(playing: Boolean) {
            isPlaying = playing
            updatePlayPauseIcon()
        }
        override fun onMediaItemTransition(item: androidx.media3.common.MediaItem?, reason: Int) {
            val idx = RadioService.STATIONS.indexOfFirst { it.url == item?.localConfiguration?.uri.toString() }
            if (idx != -1) {
                currentStation = idx
                updatePlayerBar()
            }
        }
    }
}
