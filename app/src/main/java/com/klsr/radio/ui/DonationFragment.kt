package com.kingdomlifestyleradio.klsradio.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.kingdomlifestyleradio.klsradio.R
import com.kingdomlifestyleradio.klsradio.databinding.FragmentDonationBinding

class DonationFragment : Fragment(R.layout.fragment_donation) {
    private var _binding: FragmentDonationBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentDonationBinding.bind(view)

        try { binding.zenithLogo.setImageResource(R.drawable.zenith_bank_logo) } catch (_: Exception) {}
        try { binding.gtbankNgnLogo.setImageResource(R.drawable.gtbank_logo) } catch (_: Exception) {}
        try { binding.gtbankUsdLogo.setImageResource(R.drawable.gtbank_logo) } catch (_: Exception) {}

        binding.copyZenithBtn.setOnClickListener { copy("1229216755") }
        binding.copyGtbankNgnBtn.setOnClickListener { copy("0892125365") }
        binding.copyGtbankUsdBtn.setOnClickListener { copy("0892172060") }
    }

    private fun copy(text: String) {
        val cm = requireContext().getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        cm.setPrimaryClip(ClipData.newPlainText("account", text))
        Toast.makeText(requireContext(), "Copied: $text", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
