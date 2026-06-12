package com.kingdomlifestyleradio.klsradio.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.kingdomlifestyleradio.klsradio.databinding.ItemHeroSlideBinding

class HeroSliderAdapter(private val images: List<Int>) : RecyclerView.Adapter<HeroSliderAdapter.VH>() {
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val b = ItemHeroSlideBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(b)
    }
    override fun onBindViewHolder(holder: VH, position: Int) { holder.bind(images[position]) }
    override fun getItemCount() = images.size
    class VH(private val b: ItemHeroSlideBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(img: Int) { b.imageView.setImageResource(img) }
    }
}
