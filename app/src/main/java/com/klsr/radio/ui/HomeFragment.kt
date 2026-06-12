package com.kingdomlifestyleradio.klsradio.ui

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import androidx.fragment.app.Fragment
import androidx.viewpager2.widget.ViewPager2
import com.kingdomlifestyleradio.klsradio.R
import com.kingdomlifestyleradio.klsradio.RadioService
import com.kingdomlifestyleradio.klsradio.adapters.HeroSliderAdapter
import com.kingdomlifestyleradio.klsradio.databinding.FragmentHomeBinding
import java.io.File

class HomeFragment : Fragment(R.layout.fragment_home) {
    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding
    private val handler = Handler(Looper.getMainLooper())
    private var runnable: Runnable? = null
    private var currentSlide = 0
    private val images = listOf(R.drawable.herr1, R.drawable.herr2, R.drawable.herr3, R.drawable.herr4)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentHomeBinding.bind(view)

        // Show last crash if available
        binding?.let { b ->
            try {
                val file = File(requireContext().filesDir, "last_crash.txt")
                if (file.exists()) {
                    b.tvCrashError.text = "Last crash:\n${file.readText()}"
                    b.tvCrashError.visibility = View.VISIBLE
                } else {
                    b.tvCrashError.visibility = View.GONE
                }
            } catch (_: Exception) {}
        }

        // Setup fading slider
        binding?.heroViewPager?.apply {
            adapter = HeroSliderAdapter(images)
            setPageTransformer(FadePageTransformer())
            registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
                override fun onPageSelected(position: Int) {
                    currentSlide = position
                    startAutoSlide()
                }
            })
            startAutoSlide()
        }

        // Listen Live button – start or toggle the radio
        binding?.btnListenLive?.setOnClickListener {
            // Send an intent to start the service with the first station (or current)
            val intent = Intent(requireContext(), RadioService::class.java).apply {
                putExtra(RadioService.EXTRA_STATION_INDEX, 0)
                // No action set → service will start playback
            }
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O)
                requireContext().startForegroundService(intent)
            else
                requireContext().startService(intent)

            // The bottom bar icon will automatically switch to pause
            // because the MediaController listener in MainActivity updates it.
        }
    }

    private fun startAutoSlide() {
        runnable?.let { handler.removeCallbacks(it) }
        val r = object : Runnable {
            override fun run() {
                binding?.heroViewPager?.let {
                    currentSlide = (currentSlide + 1) % images.size
                    it.setCurrentItem(currentSlide, true)
                }
                handler.postDelayed(this, 5000)
            }
        }
        runnable = r
        handler.postDelayed(r, 5000)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        runnable?.let { handler.removeCallbacks(it) }
        _binding = null
    }

    /** Simple fade transition for ViewPager2 */
    inner class FadePageTransformer : ViewPager2.PageTransformer {
        override fun transformPage(page: View, position: Float) {
            page.apply {
                alpha = when {
                    position < -1 -> 0f
                    position <= 1 -> 1 - Math.abs(position)
                    else -> 0f
                }
                translationX = 0f
            }
        }
    }
}
