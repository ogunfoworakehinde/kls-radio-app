document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-links') && !e.target.closest('.hamburger')) {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
    
    // Radio player functionality
    const playBtn = document.querySelector('.play-btn');
    const channelSwitcher = document.querySelector('.channel-switcher');
    const stationInfo = document.querySelector('.station-info h3');
    const audioPlayer = document.getElementById('radio-player');
    
    let isPlaying = false;
    let currentChannel = 'english';
    
    // Set stream URLs from PHP defines
    const streams = {
        english: '<?php echo ENGLISH_STREAM; ?>',
        yoruba: '<?php echo YORUBA_STREAM; ?>'
    };
    
    // Initialize player
    function initPlayer() {
        audioPlayer.src = streams[currentChannel];
        audioPlayer.load();
        
        // Handle autoplay restrictions
        document.body.addEventListener('click', function() {
            if (isPlaying && audioPlayer.paused) {
                audioPlayer.play().catch(e => console.log('Autoplay prevented:', e));
            }
        }, { once: true });
    }
    
    initPlayer();
    
    playBtn.addEventListener('click', function() {
        isPlaying = !isPlaying;
        
        if (isPlaying) {
            this.innerHTML = '❚❚';
            audioPlayer.play().catch(e => {
                console.log('Playback failed:', e);
                // Show message to user about clicking to play
                alert('Please click anywhere on the page to start playback');
            });
        } else {
            this.innerHTML = '▶';
            audioPlayer.pause();
        }
    });
    
    channelSwitcher.addEventListener('click', function() {
        currentChannel = currentChannel === 'english' ? 'yoruba' : 'english';
        stationInfo.textContent = `Now Live: ${currentChannel === 'english' ? 'English' : 'Yoruba'} Channel`;
        this.textContent = `Switch to ${currentChannel === 'english' ? 'Yoruba' : 'English'} Channel`;
        
        // Change stream without interrupting playback
        const wasPlaying = !audioPlayer.paused;
        audioPlayer.src = streams[currentChannel];
        if (wasPlaying) {
            audioPlayer.play().catch(e => console.log('Stream switch failed:', e));
        } else {
            audioPlayer.load();
        }
    });
    
    // SPA Navigation
    function loadPage(pageId, pushState = true) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected page
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.add('active');
            
            // Load content dynamically for blog pages
            if (pageId === 'blog-page') {
                loadBlogPosts();
            }
            
            // Update active nav item
            document.querySelectorAll('.nav-links a').forEach(navItem => {
                navItem.classList.remove('active');
                if (navItem.getAttribute('data-page') === pageId.replace('-page', '')) {
                    navItem.classList.add('active');
                }
            });
            
            // Close mobile menu if open
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Update browser history
            if (pushState) {
                history.pushState({ page: pageId }, '', `#${pageId}`);
            }
        }
    }
    
    // Load blog posts via AJAX
    function loadBlogPosts() {
        fetch('radio/player.php?action=get_posts')
            .then(response => response.json())
            .then(posts => {
                const container = document.getElementById('blog-posts-container');
                container.innerHTML = '';
                
                posts.forEach(post => {
                    const postDate = new Date(post.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    
                    const postHTML = `
                        <div class="blog-card">
                            <div class="blog-image">
                                <img src="${post.featured_image || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'}" alt="${post.title}">
                            </div>
                            <div class="blog-content">
                                <div class="blog-meta">
                                    <span><i class="far fa-calendar-alt"></i> ${postDate}</span>
                                    <span><i class="far fa-user"></i> Admin</span>
                                </div>
                                <h3>${post.title}</h3>
                                <p>${post.excerpt}</p>
                                <a href="#" class="read-more" data-blog="${post.slug}">Read More →</a>
                            </div>
                        </div>
                    `;
                    
                    container.insertAdjacentHTML('beforeend', postHTML);
                });
            })
            .catch(error => console.error('Error loading blog posts:', error));
    }
    
    // Load single blog post
    function loadSinglePost(slug) {
        fetch(`radio/player.php?action=get_post&slug=${slug}`)
            .then(response => response.json())
            .then(post => {
                if (post.error) {
                    console.error(post.error);
                    return;
                }
                
                const postDate = new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                const singleBlogPage = document.getElementById('single-blog-page');
                singleBlogPage.innerHTML = `
                    <section class="hero" style="background-image: linear-gradient(rgba(10, 36, 99, 0.7), rgba(10, 36, 99, 0.7)), url('${post.featured_image || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'}');">
                        <div class="container">
                            <h1>${post.title}</h1>
                            <p>${post.excerpt}</p>
                        </div>
                    </section>
                    <section class="single-blog">
                        <div class="container">
                            <div class="blog-header">
                                <img src="${post.featured_image || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'}" alt="${post.title}">
                                <div class="blog-meta">
                                    <span><i class="far fa-calendar-alt"></i> ${postDate}</span>
                                    <span><i class="far fa-user"></i> Admin</span>
                                </div>
                            </div>
                            <div class="blog-content">
                                ${post.content}
                                <a href="#" class="back-to-blog" data-page="blog"><i class="fas fa-arrow-left"></i> Back to Blog</a>
                            </div>
                        </div>
                    </section>
                `;
                
                loadPage('single-blog-page', false);
            })
            .catch(error => console.error('Error loading blog post:', error));
    }
    
    // Handle navigation
    document.addEventListener('click', function(e) {
        // Page navigation
        if (e.target.closest('[data-page]')) {
            e.preventDefault();
            const page = e.target.closest('[data-page]').getAttribute('data-page');
            loadPage(`${page}-page`);
        }
        
        // Blog post links
        if (e.target.closest('.read-more')) {
            e.preventDefault();
            const slug = e.target.closest('.read-more').getAttribute('data-blog');
            loadSinglePost(slug);
        }
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.page) {
            loadPage(e.state.page, false);
        } else {
            loadPage('home-page', false);
        }
    });
    
    // Initial page load
    if (window.location.hash) {
        const pageId = window.location.hash.replace('#', '');
        loadPage(pageId, false);
    } else {
        loadPage('home-page', false);
    }
    
    // Scroll to top functionality
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    let lastScrollPosition = 0;
    
    window.addEventListener('scroll', function() {
        const currentScrollPosition = window.pageYOffset;
        if (currentScrollPosition > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    
        // Hide/show radio player on scroll
        const radioPlayer = document.querySelector('.radio-player');
        if (currentScrollPosition > lastScrollPosition) {
            // Scrolling down
            radioPlayer.classList.add('hidden');
        } else {
            // Scrolling up
            radioPlayer.classList.remove('hidden');
        }
        lastScrollPosition = currentScrollPosition;
    });
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
 