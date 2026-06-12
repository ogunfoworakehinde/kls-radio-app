package com.kingdomlifestyleradio.klsradio.adapters

import android.text.Html
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.RoundedCorners
import com.bumptech.glide.request.RequestOptions
import com.kingdomlifestyleradio.klsradio.R
import com.kingdomlifestyleradio.klsradio.data.PodcastEpisode
import com.kingdomlifestyleradio.klsradio.databinding.ItemPodcastBinding
import java.text.SimpleDateFormat
import java.util.Locale

class PodcastAdapter(
    private val items: List<PodcastEpisode>,
    private val onPlayClick: (PodcastEpisode) -> Unit
) : RecyclerView.Adapter<PodcastAdapter.VH>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val b = ItemPodcastBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(b)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount() = items.size

    inner class VH(private val b: ItemPodcastBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(episode: PodcastEpisode) {
            b.podcastTitle.text = episode.title

            // Strip HTML from description to get clean text
            val cleanDesc = episode.description?.let {
                // Remove HTML tags
                it.replace(Regex("<[^>]+>"), " ")
                    .replace(Regex("\\s+"), " ")
                    .trim()
            } ?: ""
            b.podcastDescription.text = cleanDesc

            // Date formatting
            try {
                val inputFormat = SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", Locale.ENGLISH)
                val outputFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
                episode.pubDate?.let { dateStr ->
                    val date = inputFormat.parse(dateStr)
                    b.podcastDate.text = date?.let { outputFormat.format(it) } ?: dateStr.take(10)
                }
            } catch (e: Exception) {
                b.podcastDate.text = episode.pubDate?.take(10) ?: ""
            }

            b.podcastDuration.text = episode.duration ?: ""

            // Load image with Glide, fallback to a colored placeholder
            Glide.with(b.root.context)
                .load(episode.imageUrl)
                .apply(RequestOptions()
                    .placeholder(R.drawable.podcast_placeholder)
                    .error(R.drawable.podcast_placeholder)
                    .fitCenter()
                )
                .into(b.podcastImage)

            b.btnPlayEpisode.setOnClickListener { onPlayClick(episode) }
        }
    }
}
