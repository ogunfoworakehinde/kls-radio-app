package com.kingdomlifestyleradio.klsradio.ui

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.kingdomlifestyleradio.klsradio.R
import com.kingdomlifestyleradio.klsradio.databinding.FragmentPrayerBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class PrayerFragment : Fragment(R.layout.fragment_prayer) {
    private var _binding: FragmentPrayerBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentPrayerBinding.bind(view)
        binding.submitPrayerBtn.setOnClickListener {
            val name = binding.nameEditText.text.toString().trim()
            val email = binding.emailEditText.text.toString().trim()
            val phone = binding.phoneEditText.text.toString().trim()
            val request = binding.requestEditText.text.toString().trim()
            if (name.isEmpty() || request.isEmpty()) {
                Toast.makeText(requireContext(), "Fill required fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            submit(name, email, phone, request)
        }
    }

    private fun submit(name: String, email: String, phone: String, request: String) {
        lifecycleScope.launch {
            val ok = withContext(Dispatchers.IO) {
                try {
                    val json = JSONObject().apply {
                        put("service_id", "service_bg462kr")
                        put("template_id", "template_6pyapsf")
                        put("user_id", "835HY_wRkYBhqdu7d")
                        put("template_params", JSONObject().apply {
                            put("to_email", "support@kingdomlifestyleradio.com")
                            put("from_name", name)
                            put("from_email", email)
                            put("phone", phone)
                            put("message", request)
                        })
                    }
                    val url = URL("https://api.emailjs.com/api/v1.0/email/send")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 15000
                    conn.readTimeout = 15000
                    conn.doOutput = true
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.outputStream.write(json.toString().toByteArray())
                    conn.responseCode == 200
                } catch (e: Exception) { false }
            }
            if (!isAdded) return@launch
            Toast.makeText(requireContext(),
                if (ok) "Prayer request sent!" else "Prayer received in spirit",
                Toast.LENGTH_SHORT).show()
            if (ok) {
                _binding?.let {
                    it.nameEditText.text?.clear()
                    it.requestEditText.text?.clear()
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
