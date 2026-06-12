package com.kingdomlifestyleradio.klsradio.utils

import android.content.Context
import android.content.Intent
import android.os.Process
import java.io.PrintWriter
import java.io.StringWriter
import java.io.File

class CrashHandler(private val defaultHandler: Thread.UncaughtExceptionHandler?) :
    Thread.UncaughtExceptionHandler {

    override fun uncaughtException(thread: Thread, exception: Throwable) {
        val sw = StringWriter()
        exception.printStackTrace(PrintWriter(sw))
        val stacktrace = sw.toString()

        // Save to a file
        try {
            val file = File("/data/data/com.kingdomlifestyleradio.klsradio/files/last_crash.txt")
            file.parentFile?.mkdirs()
            file.writeText(stacktrace)
        } catch (_: Exception) {}

        // Also save to shared preferences as fallback
        try {
            val prefs = App.context?.getSharedPreferences("crash", Context.MODE_PRIVATE)
            prefs?.edit()?.putString("last_error", stacktrace)?.apply()
        } catch (_: Exception) {}

        // Call default handler to show system crash dialog (or restart)
        defaultHandler?.uncaughtException(thread, exception)
        // If no default, kill process
        if (defaultHandler == null) {
            Process.killProcess(Process.myPid())
        }
    }

    companion object {
        fun init(context: Context) {
            val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
            Thread.setDefaultUncaughtExceptionHandler(CrashHandler(defaultHandler))
            // Store context for crash handler use
            App.context = context.applicationContext
        }
    }
}

// A simple object to hold a static context reference
object App {
    var context: Context? = null
}
