package com.kingdomlifestyleradio.klsradio

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.animation.LinearInterpolator
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        val circles = listOf(
            findViewById<ImageView>(R.id.circle1),
            findViewById<ImageView>(R.id.circle2),
            findViewById<ImageView>(R.id.circle3),
            findViewById<ImageView>(R.id.circle4)
        )

        circles.forEachIndexed { index, circle ->
            circle.visibility = View.VISIBLE
            startPulseAnimation(circle, index * 200L)
        }

        // Open MainActivity after 3.5 seconds
        window.decorView.postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }, 3500)
    }

    private fun startPulseAnimation(view: View, startDelay: Long) {
        val scaleX = ObjectAnimator.ofFloat(view, "scaleX", 0.8f, 1.3f)
        val scaleY = ObjectAnimator.ofFloat(view, "scaleY", 0.8f, 1.3f)
        val alpha = ObjectAnimator.ofFloat(view, "alpha", 0.6f, 0.0f)

        listOf(scaleX, scaleY, alpha).forEach {
            it.duration = 1200
            it.repeatCount = ValueAnimator.INFINITE
            it.repeatMode = ValueAnimator.REVERSE
            it.interpolator = LinearInterpolator()
        }

        val set = AnimatorSet()
        set.playTogether(scaleX, scaleY, alpha)
        set.startDelay = startDelay
        set.start()
    }
}
