package com.kingdomlifestyleradio.klsradio.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.kingdomlifestyleradio.klsradio.R
import com.kingdomlifestyleradio.klsradio.data.BlogPost

class BlogHeroAdapter(
    private val posts: List<BlogPost>,
    private val onClick: (Int) -> Unit
) : RecyclerView.Adapter<BlogHeroAdapter.VH>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_blog_hero_slide, parent, false)
        return VH(view)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        holder.bind(posts[position])
    }

    override fun getItemCount() = posts.size

    inner class VH(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val image: ImageView = itemView.findViewById(R.id.heroImage)
        private val title: TextView = itemView.findViewById(R.id.heroTitle)
        private val date: TextView = itemView.findViewById(R.id.heroDate)
        private val readMore: View = itemView.findViewById(R.id.heroReadMoreBtn)

        fun bind(post: BlogPost) {
            title.text = post.title
            date.text = post.date
            post.featuredMediaUrl?.let {
                Glide.with(itemView.context).load(it).into(image)
            }
            readMore.setOnClickListener { onClick(post.id) }
        }
    }
}
