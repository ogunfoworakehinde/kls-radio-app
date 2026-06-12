package com.kingdomlifestyleradio.klsradio.ui

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.viewpager2.widget.ViewPager2
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.kingdomlifestyleradio.klsradio.R
import com.kingdomlifestyleradio.klsradio.adapters.BlogPostAdapter
import com.kingdomlifestyleradio.klsradio.adapters.BlogHeroSliderAdapter
import com.kingdomlifestyleradio.klsradio.data.BlogPost
import com.kingdomlifestyleradio.klsradio.data.BlogPostResponse
import com.kingdomlifestyleradio.klsradio.databinding.FragmentBlogBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

class BlogFragment : Fragment(R.layout.fragment_blog) {
    private var _binding: FragmentBlogBinding? = null
    private val binding get() = _binding!!
    private var allPosts = emptyList<BlogPost>()
    private var heroPosts = emptyList<BlogPost>()
    private var currentPage = 1
    private var totalPages = 1
    private val handler = Handler(Looper.getMainLooper())
    private var heroRunnable: Runnable? = null
    private var heroCurrentIndex = 0

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentBlogBinding.bind(view)

        binding.blogRecyclerView.layoutManager = LinearLayoutManager(requireContext())
        binding.blogRecyclerView.isNestedScrollingEnabled = false

        loadHeroPosts()
        loadPosts(1)

        binding.searchEditText.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) { filter(s?.toString() ?: "") }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        binding.paginationControls.prevPageBtn.setOnClickListener {
            if (currentPage > 1) loadPosts(currentPage - 1)
        }
        binding.paginationControls.nextPageBtn.setOnClickListener {
            if (currentPage < totalPages) loadPosts(currentPage + 1)
        }
    }

    private fun loadHeroPosts() {
        lifecycleScope.launch {
            val posts = withContext(Dispatchers.IO) {
                try {
                    val url = URL("https://kingdomlifestyleradio.com/wp/wp-json/wp/v2/posts?per_page=3&_embed")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 15000
                    conn.readTimeout = 15000
                    val json = conn.inputStream.bufferedReader().readText()
                    val listType = TypeToken.getParameterized(List::class.java, BlogPostResponse::class.java).type
                    val responses: List<BlogPostResponse> = Gson().fromJson(json, listType)
                    responses.map { p ->
                        val imgUrl = p.embedded?.wpFeaturedmedia?.getOrNull(0)?.sourceUrl
                        val author = p.embedded?.author?.getOrNull(0)?.name ?: "Admin"
                        BlogPost(p.id, p.title.rendered, p.excerpt.rendered.replace(Regex("<[^>]+>"), "").take(150) + "...",
                            p.date.take(10), imgUrl, author, p.content.rendered)
                    }
                } catch (e: Exception) { emptyList() }
            }
            if (!isAdded) return@launch
            heroPosts = posts
            setupHeroSlider()
        }
    }

    private fun setupHeroSlider() {
        if (!isAdded || heroPosts.isEmpty()) {
            binding.blogHeroViewPager.visibility = View.GONE
            binding.blogHeroDots.visibility = View.GONE
            return
        }
        binding.blogHeroViewPager.visibility = View.VISIBLE
        binding.blogHeroDots.visibility = View.VISIBLE

        val adapter = BlogHeroSliderAdapter(heroPosts) { postId ->
            if (isAdded) findNavController().navigate(R.id.action_blog_to_singlePost,
                Bundle().apply { putInt("postId", postId) })
        }
        binding.blogHeroViewPager.adapter = adapter

        val dotsLayout = binding.blogHeroDots
        dotsLayout.removeAllViews()
        for (i in heroPosts.indices) {
            val dot = ImageView(requireContext()).apply {
                setImageResource(if (i == 0) R.drawable.dot_active else R.drawable.dot_inactive)
                layoutParams = LinearLayout.LayoutParams(24, 24).apply { marginEnd = 8 }
            }
            dotsLayout.addView(dot)
        }
        binding.blogHeroViewPager.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
            override fun onPageSelected(position: Int) {
                heroCurrentIndex = position
                for (i in 0 until dotsLayout.childCount) {
                    (dotsLayout.getChildAt(i) as? ImageView)?.setImageResource(
                        if (i == position) R.drawable.dot_active else R.drawable.dot_inactive
                    )
                }
                startHeroAutoSlide()
            }
        })
        startHeroAutoSlide()
    }

    private fun startHeroAutoSlide() {
        heroRunnable?.let { handler.removeCallbacks(it) }
        val r = object : Runnable {
            override fun run() {
                if (!isAdded || heroPosts.isEmpty()) return
                heroCurrentIndex = (heroCurrentIndex + 1) % heroPosts.size
                binding.blogHeroViewPager.setCurrentItem(heroCurrentIndex, true)
                handler.postDelayed(this, 5000)
            }
        }
        heroRunnable = r
        handler.postDelayed(r, 5000)
    }

    private fun loadPosts(page: Int) {
        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) {
                try {
                    val url = URL("https://kingdomlifestyleradio.com/wp/wp-json/wp/v2/posts?per_page=6&page=$page&_embed")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 15000
                    conn.readTimeout = 15000
                    val json = conn.inputStream.bufferedReader().readText()
                    val listType = TypeToken.getParameterized(List::class.java, BlogPostResponse::class.java).type
                    val responses: List<BlogPostResponse> = Gson().fromJson(json, listType)
                    val total = conn.getHeaderField("X-WP-TotalPages")?.toIntOrNull() ?: 1
                    val items = responses.map { p ->
                        val imgUrl = p.embedded?.wpFeaturedmedia?.getOrNull(0)?.sourceUrl
                        val author = p.embedded?.author?.getOrNull(0)?.name ?: "Admin"
                        BlogPost(p.id, p.title.rendered, p.excerpt.rendered.replace(Regex("<[^>]+>"), "").take(150) + "...",
                            p.date.take(10), imgUrl, author, p.content.rendered)
                    }
                    Pair(items, total)
                } catch (e: Exception) { Pair(emptyList<BlogPost>(), 1) }
            }
            if (!isAdded) return@launch
            allPosts = result.first
            totalPages = result.second
            currentPage = page
            binding.blogRecyclerView.adapter = BlogPostAdapter(allPosts) { postId ->
                if (isAdded) findNavController().navigate(R.id.action_blog_to_singlePost,
                    Bundle().apply { putInt("postId", postId) })
            }
            binding.paginationControls.pageIndicator.text = "Page $page of $totalPages"
            binding.paginationControls.root.visibility = if (totalPages > 1) View.VISIBLE else View.GONE
        }
    }

    private fun filter(query: String) {
        if (!isAdded) return
        val filtered = if (query.isBlank()) allPosts
        else allPosts.filter { it.title.contains(query, ignoreCase = true) || it.excerpt.contains(query, ignoreCase = true) }
        binding.blogRecyclerView.adapter = BlogPostAdapter(filtered) { postId ->
            if (isAdded) findNavController().navigate(R.id.action_blog_to_singlePost,
                Bundle().apply { putInt("postId", postId) })
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        heroRunnable?.let { handler.removeCallbacks(it) }
        _binding = null
    }
}
