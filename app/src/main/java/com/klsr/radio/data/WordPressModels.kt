package com.kingdomlifestyleradio.klsradio.data

import com.google.gson.annotations.SerializedName

data class BlogPostResponse(
    val id: Int,
    val title: Title,
    val excerpt: Excerpt,
    val date: String,
    val content: Content,
    @SerializedName("_embedded") val embedded: Embedded? = null
)

data class Title(val rendered: String)
data class Excerpt(val rendered: String)
data class Content(val rendered: String)

data class Embedded(
    @SerializedName("wp:featuredmedia") val wpFeaturedmedia: List<Media>? = null,
    val author: List<Author>? = null
)

data class Media(val source_url: String?) {
    val sourceUrl: String? get() = source_url
}

data class Author(val name: String?)
