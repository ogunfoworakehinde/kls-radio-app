package com.kingdomlifestyleradio.klsradio.ui

import android.media.MediaPlayer
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.kingdomlifestyleradio.klsradio.R
import com.kingdomlifestyleradio.klsradio.adapters.PodcastAdapter
import com.kingdomlifestyleradio.klsradio.data.PodcastEpisode
import com.kingdomlifestyleradio.klsradio.databinding.FragmentPodcastBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory
import java.net.HttpURLConnection
import java.net.URL

class PodcastFragment : Fragment(R.layout.fragment_podcast) {
    private var _binding: FragmentPodcastBinding? = null
    private val binding get() = _binding!!
    private var mediaPlayer: MediaPlayer? = null
    private var currentEpisode: PodcastEpisode? = null

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentPodcastBinding.bind(view)

        binding.podcastHeroImage.setImageResource(R.drawable.hepp)
        binding.podcastRecyclerView.layoutManager = LinearLayoutManager(requireContext())
        loadPodcasts()

        binding.playerLayout.btnPodcastPlayPause.setOnClickListener {
            currentEpisode?.let { togglePlayPause() }
        }
    }

    private fun togglePlayPause() {
        if (mediaPlayer?.isPlaying == true) {
            mediaPlayer?.pause()
        } else {
            mediaPlayer?.start()
        }
        updatePlayPauseIcon()
    }

    private fun updatePlayPauseIcon() {
        val icon = if (mediaPlayer?.isPlaying == true) R.drawable.ic_pause else R.drawable.ic_play_arrow
        binding.playerLayout.btnPodcastPlayPause.setImageResource(icon)
    }

    private fun loadPodcasts() {
        lifecycleScope.launch {
            val list = withContext(Dispatchers.IO) {
                try {
                    val url = URL("https://anchor.fm/s/1d6ad87c/podcast/rss")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 15000
                    val input = conn.inputStream
                    val factory = XmlPullParserFactory.newInstance()
                    factory.isNamespaceAware = true
                    val parser = factory.newPullParser()
                    parser.setInput(input, null)
                    val episodes = mutableListOf<PodcastEpisode>()
                    var current: PodcastEpisode? = null
                    var tag = ""
                    var eventType = parser.eventType
                    while (eventType != XmlPullParser.END_DOCUMENT) {
                        when (eventType) {
                            XmlPullParser.START_TAG -> {
                                tag = parser.name
                                when (tag) {
                                    "item" -> current = PodcastEpisode()
                                    "itunes:image", "image" -> {
                                        val href = parser.getAttributeValue(null, "href")
                                        if (href != null && current != null) {
                                            current!!.imageUrl = href
                                        }
                                    }
                                    "enclosure" -> {
                                        val audioUrl = parser.getAttributeValue(null, "url")
                                        if (audioUrl != null && current != null) {
                                            current!!.audioUrl = audioUrl
                                        }
                                    }
                                }
                            }
                            XmlPullParser.TEXT -> {
                                if (current != null) {
                                    val text = parser.text ?: ""
                                    when (tag) {
                                        "title" -> current!!.title = text
                                        "description" -> current!!.description = text
                                        "pubDate" -> current!!.pubDate = text
                                        "itunes:duration" -> current!!.duration = text
                                    }
                                }
                            }
                            XmlPullParser.END_TAG -> {
                                if (parser.name == "item") {
                                    current?.let { episodes.add(it) }
                                    current = null
                                }
                                tag = ""
                            }
                        }
                        eventType = parser.next()
                    }
                    episodes
                } catch (e: Exception) {
                    Log.e("PodcastFragment", "RSS error", e)
                    emptyList()
                }
            }
            binding.episodeCountText.text = "${list.size} episodes available"
            binding.podcastRecyclerView.adapter = PodcastAdapter(list) { episode -> playEpisode(episode) }
        }
    }

    private fun playEpisode(episode: PodcastEpisode) {
        currentEpisode = episode
        mediaPlayer?.release()
        mediaPlayer = null

        if (episode.audioUrl.isNullOrBlank()) {
            Toast.makeText(requireContext(), "No audio URL", Toast.LENGTH_SHORT).show()
            return
        }

        // Clean HTML from description for the player bar
        val cleanDesc = episode.description?.let {
            it.replace(Regex("<[^>]+>"), " ")
              .replace(Regex("\\s+"), " ")
              .trim()
        } ?: ""

        mediaPlayer = MediaPlayer().apply {
            setOnPreparedListener {
                start()
                updatePlayPauseIcon()
                binding.playerLayout.currentPodcastTitle.text = episode.title
                binding.playerLayout.currentPodcastDescription.text = cleanDesc
                binding.playerLayout.root.visibility = View.VISIBLE
            }
            setOnErrorListener { _, _, _ ->
                Toast.makeText(requireContext(), "Playback error", Toast.LENGTH_SHORT).show()
                true
            }
            try {
                setDataSource(episode.audioUrl)
                prepareAsync()
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Cannot play episode", Toast.LENGTH_SHORT).show()
                Log.e("PodcastFragment", "setDataSource failed", e)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        mediaPlayer?.release()
        mediaPlayer = null
        _binding = null
    }
}
