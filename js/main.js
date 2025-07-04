// Main application initialization and event handling
document.addEventListener('DOMContentLoaded', init);

function init() {
    cacheElements();
    ThemeManager.initialize();
    setupEventListeners();
    handleUrlParams();
    APIManager.loadUserData();
    APIManager.loadRepositories();
    setupScrollEffects();
}

function cacheElements() {
    const ids = [
        'themeToggle', 'themeDropdown', 'userAvatar', 'repoCount', 'followerCount', 
        'followingCount', 'searchInput', 'clearSearch', 'languageFilter', 'sortFilter', 
        'orderFilter', 'repoGrid', 'loading', 'pagination', 'paginationInfo', 
        'pageNumbers', 'prevBtn', 'nextBtn', 'scrollTop'
    ];
    
    ids.forEach(id => {
        elements[id] = document.getElementById(id);
    });
    
    elements.viewBtns = document.querySelectorAll('.view-btn');
    elements.themeOptions = document.querySelectorAll('.theme-option');
}

function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    
    if (page === 'about') {
        setTimeout(() => UIManager.scrollToSection('about-section'), 100);
    } else if (page === 'repo') {
        setTimeout(() => UIManager.scrollToSection('repo-section'), 100);
    }
}

function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', (e) => {
        if (e.shiftKey) {
            e.preventDefault();
            ThemeManager.showDropdown();
        } else {
            ThemeManager.toggle();
        }
    });
    
    // Theme dropdown
    elements.themeDropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.theme-option');
        if (option) ThemeManager.select(option.dataset.theme);
    });
    
    // Search
    let searchTimeout;
    elements.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.currentPage = 1;
            UIManager.applyFilters();
        }, 300);
    });
    
    // Clear search
    elements.clearSearch.addEventListener('click', () => UIManager.clearSearch());
    
    // Filters
    [elements.languageFilter, elements.sortFilter, elements.orderFilter].forEach(filter => {
        filter.addEventListener('change', () => {
            state.currentPage = 1;
            UIManager.applyFilters();
        });
    });
    
    // View toggles
    elements.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => UIManager.setView(btn.dataset.view));
    });
    
    // Pagination
    elements.prevBtn.addEventListener('click', () => {
        if (state.currentPage > 1) UIManager.goToPage(state.currentPage - 1);
    });
    
    elements.nextBtn.addEventListener('click', () => {
        if (state.currentPage < state.totalPages) UIManager.goToPage(state.currentPage + 1);
    });
    
    // Scroll to top
    elements.scrollTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea, select')) return;
        
        switch (e.key.toLowerCase()) {
            case 'k':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    elements.searchInput.focus();
                }
                break;
            case 't':
                if (e.shiftKey) {
                    ThemeManager.showDropdown();
                } else {
                    ThemeManager.toggle();
                }
                break;
            case 'escape':
                ThemeManager.hideDropdown();
                break;
            case '/':
                e.preventDefault();
                elements.searchInput.focus();
                break;
        }
    });
    
    // Smooth scrolling for anchor links
    document.addEventListener('click', (e) => {
        if (e.target.matches('a[href^="#"]')) {
            e.preventDefault();
            const target = document.querySelector(e.target.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
}

function setupScrollEffects() {
    let ticking = false;
    
    function updateScrollEffects() {
        const scrollY = window.scrollY;
        
        // Show/hide scroll to top
        elements.scrollTop.style.display = scrollY > 300 ? 'flex' : 'none';
        
        // Navbar effect
        const nav = document.querySelector('.nav-glass');
        if (scrollY > 50) {
            nav.style.background = 'var(--glass-bg-strong)';
            nav.style.backdropFilter = 'blur(30px)';
        } else {
            nav.style.background = '';
            nav.style.backdropFilter = '';
        }
        
        // Parallax orbs
        document.querySelectorAll('.glass-orb').forEach((orb, index) => {
            const speed = 0.3 + (index * 0.1);
            orb.style.transform = `translateY(${scrollY * speed}px)`;
        });
        
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    });
}

// Error handling
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault();
});

window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
});

// Debug (remove in production)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.debug = { state, elements, CONFIG, CacheManager, ThemeManager, APIManager, UIManager };
}