package com.kingdomlifestyleradio.klsradio.data

data class PodcastEpisode(
    var title: String = "",
    var description: String = "",
    var imageUrl: String? = null,
    var audioUrl: String? = null,
    var pubDate: String? = null,
    var duration: String? = null,
    var author: String? = null
)
