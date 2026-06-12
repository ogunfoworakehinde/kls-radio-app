package com.kingdomlifestyleradio.klsradio.ui

import android.os.Bundle
import android.text.Html
import android.view.View
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.bumptech.glide.Glide
import com.google.gson.Gson
import com.kingdomlifestyleradio.klsradio.R
import com.kingdomlifestyleradio.klsradio.data.BlogPostResponse
import com.kingdomlifestyleradio.klsradio.databinding.FragmentSinglePostBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

class SinglePostFragment : Fragment(R.layout.fragment_single_post) {
    private var _binding: FragmentSinglePostBinding? = null
    private val binding get() = _binding!!
    private val postId: Int by lazy { arguments?.getInt("postId", 0) ?: 0 }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentSinglePostBinding.bind(view)
        binding.backBtn.setOnClickListener { findNavController().popBackStack() }
        loadPost()
    }

    private fun loadPost() {
        lifecycleScope.launch {
            val post = withContext(Dispatchers.IO) {
                try {
                    val url = URL("https://kingdomlifestyleradio.com/wp/wp-json/wp/v2/posts/$postId?_embed")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 15000
                    conn.readTimeout = 15000
                    val json = conn.inputStream.bufferedReader().readText()
                    Gson().fromJson(json, BlogPostResponse::class.java)
                } catch (e: Exception) { null }
            }
            if (!isAdded) return@launch
            post?.let { p ->
                binding.postTitle.text = p.title.rendered
                binding.postDate.text = p.date.take(10)
                val author = p.embedded?.author?.getOrNull(0)?.name ?: "Admin"
                binding.postAuthor.text = author
                val imgUrl = p.embedded?.wpFeaturedmedia?.getOrNull(0)?.sourceUrl
                if (imgUrl != null) {
                    Glide.with(requireContext()).load(imgUrl as Any).into(binding.featuredImage)
                }
                binding.postContent.text = Html.fromHtml(p.content.rendered, Html.FROM_HTML_MODE_COMPACT)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
