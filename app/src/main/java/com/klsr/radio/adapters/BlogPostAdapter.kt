package com.kingdomlifestyleradio.klsradio.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.kingdomlifestyleradio.klsradio.data.BlogPost
import com.kingdomlifestyleradio.klsradio.databinding.ItemBlogPostBinding

class BlogPostAdapter(
    private val items: List<BlogPost>,
    private val onClick: (Int) -> Unit
) : RecyclerView.Adapter<BlogPostAdapter.VH>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val b = ItemBlogPostBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(b)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount() = items.size

    inner class VH(private val b: ItemBlogPostBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(post: BlogPost) {
            b.blogTitle.text = post.title
            b.blogExcerpt.text = post.excerpt
            b.blogDate.text = post.date
            b.blogAuthor.text = post.authorName
            post.featuredMediaUrl?.let {
                Glide.with(b.root.context).load(it).into(b.blogImage)
            }
            b.btnReadMore.setOnClickListener { onClick(post.id) }
        }
    }
}
