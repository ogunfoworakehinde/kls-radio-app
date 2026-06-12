package com.kingdomlifestyleradio.klsradio.ui

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.kingdomlifestyleradio.klsradio.R
import com.kingdomlifestyleradio.klsradio.databinding.FragmentContactBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class ContactFragment : Fragment(R.layout.fragment_contact) {
    private var _binding: FragmentContactBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentContactBinding.bind(view)

        // Send message
        binding.sendContactBtn.setOnClickListener {
            val name = binding.contactNameEditText.text.toString().trim()
            val email = binding.contactEmailEditText.text.toString().trim()
            val subject = binding.contactSubjectEditText.text.toString().trim()
            val msg = binding.contactMessageEditText.text.toString().trim()
            if (name.isEmpty() || email.isEmpty() || msg.isEmpty()) {
                Toast.makeText(requireContext(), "Please fill required fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            sendEmailJS(name, email, subject, msg)
        }

        // Social media buttons
        binding.btnWhatsapp.setOnClickListener { openUrl("https://wa.me/2349160006614") }
        binding.btnFacebook.setOnClickListener { openUrl("https://www.facebook.com/kingdomLifestyleradio/") }
        binding.btnTwitter.setOnClickListener { openUrl("https://twitter.com/kingdomlifestr") }
        binding.btnInstagram.setOnClickListener { openUrl("https://instagram.com/kingdom.lifestyleradio") }
        binding.btnYoutube.setOnClickListener { openUrl("https://m.youtube.com/channel/UC64-kfcZkFuIi83pPqFpECQ") }
        binding.btnTelegram.setOnClickListener { openUrl("https://t.me/kingdomlifestyleradio") }
        binding.btnWebsite.setOnClickListener { openUrl("https://kingdomlifestyleradio.com") }
    }

    private fun openUrl(url: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        } catch (e: Exception) {
            Toast.makeText(requireContext(), "Could not open link", Toast.LENGTH_SHORT).show()
        }
    }

    private fun sendEmailJS(name: String, email: String, subject: String, message: String) {
        lifecycleScope.launch {
            val ok = withContext(Dispatchers.IO) {
                try {
                    val json = JSONObject().apply {
                        put("service_id", "service_bg462kr")
                        put("template_id", "template_6pyapsf")
                        put("user_id", "835HY_wRkYBhqdu7d")
                        put("template_params", JSONObject().apply {
                            put("to_email", "robinlaura101@gmail.com")
                            put("from_name", name)
                            put("from_email", email)
                            put("subject", subject)
                            put("message", message)
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
                if (ok) "Message sent!" else "We'll get back to you.",
                Toast.LENGTH_SHORT).show()
            if (ok) {
                binding.contactNameEditText.text?.clear()
                binding.contactEmailEditText.text?.clear()
                binding.contactSubjectEditText.text?.clear()
                binding.contactMessageEditText.text?.clear()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
