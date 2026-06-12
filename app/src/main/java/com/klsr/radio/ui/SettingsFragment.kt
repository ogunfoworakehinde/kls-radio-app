package com.kingdomlifestyleradio.klsradio.ui

import android.content.Intent
import android.content.SharedPreferences
import android.media.AudioManager
import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.Toast
import androidx.appcompat.app.AppCompatDelegate
import androidx.fragment.app.Fragment
import com.kingdomlifestyleradio.klsradio.MainActivity
import com.kingdomlifestyleradio.klsradio.R
import com.kingdomlifestyleradio.klsradio.RadioService
import com.kingdomlifestyleradio.klsradio.databinding.FragmentSettingsBinding

class SettingsFragment : Fragment(R.layout.fragment_settings) {
    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!
    private lateinit var prefs: SharedPreferences
    private var mediaController: androidx.media3.session.MediaController? = null

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentSettingsBinding.bind(view)
        prefs = requireContext().getSharedPreferences("settings", android.content.Context.MODE_PRIVATE)

        // --- Load current settings ---
        val currentTheme = prefs.getString("app_theme", "deep_blue") ?: "deep_blue"
        binding.themeSpinner.setSelection(if (currentTheme == "dark") 1 else 0)

        binding.radioVolumeSeekBar.progress = prefs.getInt("radio_volume", 100)
        binding.podcastVolumeSeekBar.progress = prefs.getInt("podcast_volume", 100)
        binding.autoPlaySwitch.isChecked = prefs.getBoolean("auto_play", true)
        binding.notificationsSwitch.isChecked = prefs.getBoolean("notifications", true)
        binding.dataSaverSwitch.isChecked = prefs.getBoolean("data_saver", false)

        // --- Save button ---
        binding.saveSettingsBtn.setOnClickListener {
            saveAllSettings()
        }

        // --- Reset button ---
        binding.resetSettingsBtn.setOnClickListener {
            resetToDefault()
        }
    }

    private fun saveAllSettings() {
        val editor = prefs.edit()
        val themeValue = if (binding.themeSpinner.selectedItemPosition == 1) "dark" else "deep_blue"
        editor.putString("app_theme", themeValue)

        val radioVolume = binding.radioVolumeSeekBar.progress
        val podcastVolume = binding.podcastVolumeSeekBar.progress
        editor.putInt("radio_volume", radioVolume)
        editor.putInt("podcast_volume", podcastVolume)
        editor.putBoolean("auto_play", binding.autoPlaySwitch.isChecked)
        editor.putBoolean("notifications", binding.notificationsSwitch.isChecked)
        editor.putBoolean("data_saver", binding.dataSaverSwitch.isChecked)
        editor.apply()

        // Apply radio volume immediately
        applyRadioVolume(radioVolume)

        // Apply theme
        applyTheme(themeValue)

        Toast.makeText(requireContext(), "Settings saved!", Toast.LENGTH_SHORT).show()

        // Restart activity to fully apply theme
        requireActivity().finish()
        startActivity(Intent(requireContext(), MainActivity::class.java))
    }

    private fun resetToDefault() {
        prefs.edit().clear().apply()
        binding.themeSpinner.setSelection(0)
        binding.radioVolumeSeekBar.progress = 100
        binding.podcastVolumeSeekBar.progress = 100
        binding.autoPlaySwitch.isChecked = true
        binding.notificationsSwitch.isChecked = true
        binding.dataSaverSwitch.isChecked = false
        applyRadioVolume(100)
        applyTheme("deep_blue")
        Toast.makeText(requireContext(), "Settings reset to default", Toast.LENGTH_SHORT).show()
        requireActivity().finish()
        startActivity(Intent(requireContext(), MainActivity::class.java))
    }

    private fun applyRadioVolume(volume: Int) {
        // Set the volume on the audio manager (system volume) or ExoPlayer?
        // Better: send a broadcast/local intent to RadioService to adjust volume.
        // For simplicity, we'll set the stream volume for music.
        val audioManager = requireContext().getSystemService(android.content.Context.AUDIO_SERVICE) as AudioManager
        val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        val vol = (volume / 100.0 * max).toInt()
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, vol, 0)
    }

    private fun applyTheme(theme: String) {
        val mode = if (theme == "dark") AppCompatDelegate.MODE_NIGHT_YES else AppCompatDelegate.MODE_NIGHT_NO
        AppCompatDelegate.setDefaultNightMode(mode)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
