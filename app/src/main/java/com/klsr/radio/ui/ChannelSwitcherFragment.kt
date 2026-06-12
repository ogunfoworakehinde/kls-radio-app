package com.kingdomlifestyleradio.klsradio.ui

import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.setFragmentResult
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.kingdomlifestyleradio.klsradio.RadioService

class ChannelSwitcherFragment : BottomSheetDialogFragment() {
    companion object {
        const val REQUEST_KEY = "channel_switcher"
        const val RESULT_INDEX = "index"
    }

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val dialog = super.onCreateDialog(savedInstanceState)
        val root = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
        }
        RadioService.STATIONS.forEachIndexed { index, station ->
            val tv = TextView(requireContext()).apply {
                text = station.name
                setPadding(0, 16, 0, 16)
                setTextAppearance(com.google.android.material.R.style.TextAppearance_MaterialComponents_Subtitle1)
                setOnClickListener {
                    setFragmentResult(REQUEST_KEY, Bundle().apply { putInt(RESULT_INDEX, index) })
                    dismiss()
                }
            }
            root.addView(tv)
        }
        dialog.setContentView(root)
        return dialog
    }
}
