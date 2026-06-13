$(document).ready(() => {
    // Mobile menu toggle
    $('#hamburger-menu').click(() => {
        $('#hamburger-menu').toggleClass('active');
        $('#nav-menu').toggleClass('active');
    });

    // Navigation arrows for carousel
    const navText = ["<i class='bx bx-chevron-left'></i>", "<i class='bx bx-chevron-right'></i>"];

    // Fetch movie list from the backend server
    const fetchAndRenderMovies = async () => {
        try {
            const response = await fetch('/api/movies');
            if (!response.ok) {
                throw new Error('Failed to fetch movies database.');
            }
            const movies = await response.json();
            renderAllSections(movies);
        } catch (error) {
            console.error('Error fetching movies:', error);
            // In case of error, show a fallback message
            $('.owl-carousel').html('<div class="error-msg" style="color: var(--main-color); text-align: center; padding: 20px; font-weight: 600;">Failed to load movies. Is the server running?</div>');
        }
    };

    // Render all elements and then initialize Carousels
    const renderAllSections = (movies) => {
        let heroHtml = '';
        let topMoviesHtml = '';
        let latestMoviesHtml = '';
        let latestSeriesHtml = '';
        let latestCartoonsHtml = '';
        let specialMovieHtml = '';

        movies.forEach(movie => {
            // Check image paths. If they don't start with http or ./, prepend slash for server compatibility
            const imageUrl = (movie.image && (movie.image.startsWith('http') || movie.image.startsWith('./') || movie.image.startsWith('/'))) 
                ? movie.image 
                : '/' + movie.image;

            const targetLink = movie.downloadLink || '#';

            if (movie.category === 'hero') {
                heroHtml += `
                <div class="hero-slide-item">
                    <img src="${imageUrl}" alt="${movie.title}">
                    <div class="overlay"></div>
                    <div class="hero-slide-item-content">
                        <div class="item-content-wraper">
                            <div class="item-content-title top-down">
                                ${movie.title}
                            </div>
                            <div class="movie-infos top-down delay-2">
                                <div class="movie-info">
                                    <i class="bx bxs-star"></i>
                                    <span>${movie.rating}</span>
                                </div>
                                <div class="movie-info">
                                    <i class="bx bxs-time"></i>
                                    <span>${movie.duration}</span>
                                </div>
                                <div class="movie-info">
                                    <span>${movie.quality}</span>
                                </div>
                                <div class="movie-info">
                                    <span>${movie.age}</span>
                                </div>
                            </div>
                            <div class="item-content-description top-down delay-4">
                                ${movie.description || 'No description available.'}
                            </div>
                            <div class="item-action top-down delay-6">
                                <a href="${targetLink}" target="_blank" rel="noopener noreferrer" class="btn btn-hover">
                                    <i class="bx bxs-download"></i>
                                    <span>Download Now</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>`;
            } else if (movie.category === 'top') {
                topMoviesHtml += `
                <a href="${targetLink}" target="_blank" rel="noopener noreferrer" class="movie-item">
                    <img src="${imageUrl}" alt="${movie.title}">
                    <div class="movie-item-content">
                        <div class="movie-item-title">
                            ${movie.title}
                        </div>
                        <div class="movie-infos">
                            <div class="movie-info">
                                <i class="bx bxs-star"></i>
                                <span>${movie.rating}</span>
                            </div>
                            <div class="movie-info">
                                <i class="bx bxs-time"></i>
                                <span>${movie.duration}</span>
                            </div>
                            <div class="movie-info">
                                <span>${movie.quality}</span>
                            </div>
                            <div class="movie-info">
                                <span>${movie.age}</span>
                            </div>
                        </div>
                    </div>
                </a>`;
            } else if (movie.category === 'special') {
                specialMovieHtml = `
                <div class="hero-slide-item">
                    <img src="${imageUrl}" alt="${movie.title}">
                    <div class="overlay"></div>
                    <div class="hero-slide-item-content">
                        <div class="item-content-wraper">
                            <div class="item-content-title">
                                ${movie.title}
                            </div>
                            <div class="movie-infos">
                                <div class="movie-info">
                                    <i class="bx bxs-star"></i>
                                    <span>${movie.rating}</span>
                                </div>
                                <div class="movie-info">
                                    <i class="bx bxs-time"></i>
                                    <span>${movie.duration}</span>
                                </div>
                                <div class="movie-info">
                                    <span>${movie.quality}</span>
                                </div>
                                <div class="movie-info">
                                    <span>${movie.age}</span>
                                </div>
                            </div>
                            <div class="item-content-description">
                                ${movie.description || 'No description available.'}
                            </div>
                            <div class="item-action">
                                <a href="${targetLink}" target="_blank" rel="noopener noreferrer" class="btn btn-hover">
                                    <i class="bx bxs-download"></i>
                                    <span>Download Now</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>`;
            } else if (movie.category === 'latest') {
                const itemHtml = `
                <a href="${targetLink}" target="_blank" rel="noopener noreferrer" class="movie-item">
                    <img src="${imageUrl}" alt="${movie.title}">
                    <div class="movie-item-content">
                        <div class="movie-item-title">
                            ${movie.title}
                        </div>
                        <div class="movie-infos">
                            <div class="movie-info">
                                <i class="bx bxs-star"></i>
                                <span>${movie.rating}</span>
                            </div>
                            <div class="movie-info">
                                <i class="bx bxs-time"></i>
                                <span>${movie.duration}</span>
                            </div>
                            <div class="movie-info">
                                <span>${movie.quality}</span>
                            </div>
                            <div class="movie-info">
                                <span>${movie.age}</span>
                            </div>
                        </div>
                    </div>
                </a>`;

                if (movie.type === 'movie') {
                    latestMoviesHtml += itemHtml;
                } else if (movie.type === 'series') {
                    latestSeriesHtml += itemHtml;
                } else if (movie.type === 'cartoon') {
                    latestCartoonsHtml += itemHtml;
                }
            }
        });

        // Inject HTML into containers
        $('#hero-carousel').html(heroHtml || '<div style="color:#fff; padding: 50px; text-align:center;">No Hero Banner Movies added yet.</div>');
        $('#top-movies-slide').html(topMoviesHtml || '<div style="color:#fff; padding: 50px; text-align:center;">No Top Movies added yet.</div>');
        $('#latest-movies-carousel').html(latestMoviesHtml || '<div style="color:#fff; padding: 50px; text-align:center;">No Latest Movies added yet.</div>');
        $('#latest-series-carousel').html(latestSeriesHtml || '<div style="color:#fff; padding: 50px; text-align:center;">No Latest Series added yet.</div>');
        $('#latest-cartoons-carousel').html(latestCartoonsHtml || '<div style="color:#fff; padding: 50px; text-align:center;">No Latest Cartoons added yet.</div>');
        
        if (specialMovieHtml) {
            $('#special-movie-section').html(specialMovieHtml).show();
        } else {
            $('#special-movie-section').hide();
        }

        // Initialize carousels after injecting contents
        initializeCarousels();
    };

    // Owl Carousel Configuration and Startup
    const initializeCarousels = () => {
        // Hero Slide Carousel
        $('#hero-carousel').owlCarousel({
            items: 1,
            dots: false,
            loop: true,
            nav: true,
            navText: navText,
            autoplay: true,
            autoplayHoverPause: true
        });

        // Top Movies Slider
        $('#top-movies-slide').owlCarousel({
            items: 2,
            dots: false,
            loop: true,
            autoplay: true,
            autoplayHoverPause: true,
            responsive: {
                500: {
                    items: 3
                },
                1280: {
                    items: 4
                },
                1600: {
                    items: 6
                }
            }
        });

        // Latest sections (latest movies, series, cartoons)
        $('.movies-slide').each(function() {
            $(this).owlCarousel({
                items: 2,
                dots: false,
                nav: true,
                navText: navText,
                margin: 15,
                responsive: {
                    500: {
                        items: 2
                    },
                    1280: {
                        items: 4
                    },
                    1600: {
                        items: 6
                    }
                }
            });
        });
    };

    // Run fetching and rendering
    fetchAndRenderMovies();
});