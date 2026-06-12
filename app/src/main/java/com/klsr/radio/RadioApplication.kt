package com.kingdomlifestyleradio.klsradio

import android.app.Application
import androidx.appcompat.app.AppCompatDelegate
import com.kingdomlifestyleradio.klsradio.utils.CrashHandler

class RadioApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        CrashHandler.init(this)

        try {
            val prefs = getSharedPreferences("settings", MODE_PRIVATE)
            val theme = prefs.getString("app_theme", "deep_blue") ?: "deep_blue"
            val mode = if (theme == "dark") AppCompatDelegate.MODE_NIGHT_YES else AppCompatDelegate.MODE_NIGHT_NO
            AppCompatDelegate.setDefaultNightMode(mode)
        } catch (_: Exception) {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
        }
    }
}
