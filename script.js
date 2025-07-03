// GitHub API Configuration
const GITHUB_USERNAME = 'Runarok';
const GITHUB_API_BASE = 'https://api.github.com';
const REPOS_PER_PAGE = 50;

// Global State
let allRepositories = [];
let filteredRepositories = [];
let currentPage = 1;
let isLoading = false;
let hasMoreRepos = true;

// Theme Management
const themes = ['theme-dark', 'theme-light', 'theme-purple', 'theme-ocean'];
let currentThemeIndex = 0;

// DOM Elements
let elementsCache = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    cacheElements();
    initializeTheme();
    loadUserProfile();
    loadRepositories();
    setupEventListeners();
    setupScrollEffects();
});

// Cache DOM elements for better performance
function cacheElements() {
    elementsCache = {
        body: document.body,
        themeToggle: document.getElementById('themeToggle'),
        userAvatar: document.getElementById('userAvatar'),
        userBio: document.getElementById('userBio'),
        userStats: document.getElementById('userStats'),
        publicRepos: document.getElementById('publicRepos'),
        followers: document.getElementById('followers'),
        following: document.getElementById('following'),
        searchInput: document.getElementById('searchInput'),
        languageFilter: document.getElementById('languageFilter'),
        sortBy: document.getElementById('sortBy'),
        reposGrid: document.getElementById('reposGrid'),
        loadingContainer: document.getElementById('loadingContainer'),
        loadMoreContainer: document.getElementById('loadMoreContainer'),
        loadMoreBtn: document.getElementById('loadMoreBtn'),
        aboutDescription: document.getElementById('aboutDescription')
    };
}

// Theme Management Functions
function initializeTheme() {
    const savedTheme = localStorage.getItem('github-profile-theme');
    if (savedTheme && themes.includes(savedTheme)) {
        currentThemeIndex = themes.indexOf(savedTheme);
    }
    applyTheme();
    updateThemeIcon();
}

function toggleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme();
    updateThemeIcon();
    localStorage.setItem('github-profile-theme', themes[currentThemeIndex]);
}

function applyTheme() {
    elementsCache.body.className = themes[currentThemeIndex];
}

function updateThemeIcon() {
    const icons = {
        'theme-dark': 'fas fa-sun',
        'theme-light': 'fas fa-moon',
        'theme-purple': 'fas fa-palette',
        'theme-ocean': 'fas fa-water'
    };
    
    const iconClass = icons[themes[currentThemeIndex]] || 'fas fa-moon';
    elementsCache.themeToggle.innerHTML = `<i class="${iconClass}"></i>`;
}

// User Profile Loading
async function loadUserProfile() {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}`);
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const userData = await response.json();
        updateUserProfile(userData);
    } catch (error) {
        console.error('Error loading user profile:', error);
        showErrorMessage('Failed to load user profile');
    }
}

function updateUserProfile(userData) {
    // Update avatar
    if (userData.avatar_url) {
        elementsCache.userAvatar.src = userData.avatar_url;
        elementsCache.userAvatar.alt = userData.name || userData.login;
    }
    
    // Update bio
    if (userData.bio) {
        elementsCache.userBio.textContent = userData.bio;
    }
    
    // Update stats with animation
    animateCounter(elementsCache.publicRepos, userData.public_repos);
    animateCounter(elementsCache.followers, userData.followers);
    animateCounter(elementsCache.following, userData.following);
    
    // Update about description
    if (userData.bio) {
        elementsCache.aboutDescription.innerHTML = `
            ${userData.bio} <br><br>
            Welcome to my GitHub profile! Here you'll find a collection of my projects, 
            ranging from experimental ideas to production-ready applications. 
            Feel free to explore and don't hesitate to reach out if you have any questions!
        `;
    }
}

function animateCounter(element, targetValue) {
    const duration = 2000; // 2 seconds
    const startValue = 0;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
        
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Repository Loading and Management
async function loadRepositories(page = 1) {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(page === 1);
    
    try {
        const response = await fetch(
            `${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/repos?per_page=${REPOS_PER_PAGE}&page=${page}&sort=updated`
        );
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const repositories = await response.json();
        
        if (page === 1) {
            allRepositories = repositories;
        } else {
            allRepositories = [...allRepositories, ...repositories];
        }
        
        // Check if there are more repositories
        hasMoreRepos = repositories.length === REPOS_PER_PAGE;
        
        // Update language filter options
        updateLanguageFilter();
        
        // Apply current filters and display
        applyFilters();
        
    } catch (error) {
        console.error('Error loading repositories:', error);
        showErrorMessage('Failed to load repositories');
    } finally {
        isLoading = false;
        hideLoading();
    }
}

function updateLanguageFilter() {
    const languages = new Set();
    allRepositories.forEach(repo => {
        if (repo.language) {
            languages.add(repo.language);
        }
    });
    
    const sortedLanguages = Array.from(languages).sort();
    const currentValue = elementsCache.languageFilter.value;
    
    elementsCache.languageFilter.innerHTML = '<option value="">All Languages</option>';
    
    sortedLanguages.forEach(language => {
        const option = document.createElement('option');
        option.value = language;
        option.textContent = language;
        elementsCache.languageFilter.appendChild(option);
    });
    
    // Restore previous selection
    elementsCache.languageFilter.value = currentValue;
}

function applyFilters() {
    const searchTerm = elementsCache.searchInput.value.toLowerCase();
    const selectedLanguage = elementsCache.languageFilter.value;
    const sortBy = elementsCache.sortBy.value;
    
    // Filter repositories
    filteredRepositories = allRepositories.filter(repo => {
        const matchesSearch = !searchTerm || 
            repo.name.toLowerCase().includes(searchTerm) || 
            (repo.description && repo.description.toLowerCase().includes(searchTerm));
        
        const matchesLanguage = !selectedLanguage || repo.language === selectedLanguage;
        
        return matchesSearch && matchesLanguage;
    });
    
    // Sort repositories
    sortRepositories(sortBy);
    
    // Display repositories
    displayRepositories();
    
    // Update load more button visibility
    updateLoadMoreButton();
}

function sortRepositories(sortBy) {
    filteredRepositories.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'stars':
                return b.stargazers_count - a.stargazers_count;
            case 'created':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'updated':
            default:
                return new Date(b.updated_at) - new Date(a.updated_at);
        }
    });
}

function displayRepositories() {
    if (filteredRepositories.length === 0) {
        elementsCache.reposGrid.innerHTML = `
            <div class="no-repos">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
                <h3 style="color: var(--text-secondary); margin-bottom: 8px;">No repositories found</h3>
                <p style="color: var(--text-muted);">Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    const repoCards = filteredRepositories.map(repo => createRepositoryCard(repo)).join('');
    elementsCache.reposGrid.innerHTML = repoCards;
    
    // Add click events to repository cards
    addRepositoryCardEvents();
}

function createRepositoryCard(repo) {
    const updatedDate = formatRelativeTime(repo.updated_at);
    const description = repo.description || 'No description available';
    const languageColor = getLanguageColor(repo.language);
    
    return `
        <div class="repo-card" data-repo-url="${repo.html_url}">
            <div class="repo-header">
                <a href="${repo.html_url}" target="_blank" class="repo-title" onclick="event.stopPropagation()">
                    <i class="fas fa-code-branch"></i>
                    ${repo.name}
                </a>
                <span class="repo-visibility ${repo.private ? 'private' : 'public'}">
                    ${repo.private ? 'Private' : 'Public'}
                </span>
            </div>
            
            <p class="repo-description">${description}</p>
            
            <div class="repo-meta">
                ${repo.language ? `
                    <span class="repo-language">
                        <span class="language-dot" style="background-color: ${languageColor}"></span>
                        ${repo.language}
                    </span>
                ` : ''}
                
                <span class="repo-stars">
                    <i class="fas fa-star"></i>
                    ${repo.stargazers_count.toLocaleString()}
                </span>
                
                <span class="repo-forks">
                    <i class="fas fa-code-branch"></i>
                    ${repo.forks_count.toLocaleString()}
                </span>
                
                <span class="repo-updated">
                    Updated ${updatedDate}
                </span>
            </div>
        </div>
    `;
}

function addRepositoryCardEvents() {
    const repoCards = document.querySelectorAll('.repo-card');
    repoCards.forEach(card => {
        card.addEventListener('click', () => {
            const repoUrl = card.dataset.repoUrl;
            window.open(repoUrl, '_blank');
        });
    });
}

// Utility Functions
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, seconds] of Object.entries(intervals)) {
        const interval = Math.floor(diffInSeconds / seconds);
        if (interval >= 1) {
            return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
        }
    }
    
    return 'Just now';
}

function getLanguageColor(language) {
    const colors = {
        JavaScript: '#f1e05a',
        TypeScript: '#2b7489',
        Python: '#3572A5',
        Java: '#b07219',
        'C++': '#f34b7d',
        'C#': '#239120',
        PHP: '#4F5D95',
        Ruby: '#701516',
        Go: '#00ADD8',
        Rust: '#dea584',
        Swift: '#ffac45',
        Kotlin: '#F18E33',
        Dart: '#00B4AB',
        HTML: '#e34c26',
        CSS: '#1572B6',
        Vue: '#4FC08D',
        React: '#61DAFB',
        Angular: '#DD0031'
    };
    
    return colors[language] || '#6e7681';
}

function showLoading(isInitial = false) {
    if (isInitial) {
        elementsCache.loadingContainer.style.display = 'flex';
    } else {
        elementsCache.loadMoreBtn.innerHTML = `
            <div class="loading-spinner" style="width: 20px; height: 20px; margin-right: 8px;"></div>
            <span>Loading...</span>
        `;
    }
}

function hideLoading() {
    elementsCache.loadingContainer.style.display = 'none';
    elementsCache.loadMoreBtn.innerHTML = `
        <span>Load More</span>
        <i class="fas fa-chevron-down"></i>
    `;
}

function updateLoadMoreButton() {
    if (hasMoreRepos && filteredRepositories.length > 0) {
        elementsCache.loadMoreContainer.style.display = 'block';
    } else {
        elementsCache.loadMoreContainer.style.display = 'none';
    }
}

function showErrorMessage(message) {
    elementsCache.reposGrid.innerHTML = `
        <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-color); margin-bottom: 16px;"></i>
            <h3 style="color: var(--text-secondary); margin-bottom: 8px;">Oops! Something went wrong</h3>
            <p style="color: var(--text-muted); margin-bottom: 24px;">${message}</p>
            <button onclick="location.reload()" class="load-more-btn" style="background: var(--error-color); border-color: var(--error-color);">
                <i class="fas fa-refresh"></i>
                <span>Retry</span>
            </button>
        </div>
    `;
}

// Event Listeners
function setupEventListeners() {
    // Theme toggle
    elementsCache.themeToggle.addEventListener('click', toggleTheme);
    
    // Search functionality with debouncing
    let searchTimeout;
    elementsCache.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 300);
    });
    
    // Filter changes
    elementsCache.languageFilter.addEventListener('change', applyFilters);
    elementsCache.sortBy.addEventListener('change', applyFilters);
    
    // Load more repositories
    elementsCache.loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        loadRepositories(currentPage);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            elementsCache.searchInput.focus();
        }
        
        // T to toggle theme
        if (e.key === 't' && !e.ctrlKey && !e.metaKey && !isInputFocused()) {
            toggleTheme();
        }
    });
}

function isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'SELECT'
    );
}

// Scroll Effects
function setupScrollEffects() {
    let ticking = false;
    
    function updateScrollEffects() {
        const scrollY = window.scrollY;
        const nav = document.querySelector('.nav-glass');
        
        // Navbar blur effect
        if (scrollY > 100) {
            nav.style.background = 'rgba(255, 255, 255, 0.1)';
            nav.style.backdropFilter = 'blur(25px)';
        } else {
            nav.style.background = '';
            nav.style.backdropFilter = '';
        }
        
        // Parallax effect for hero orbs
        const orbs = document.querySelectorAll('.glass-orb');
        orbs.forEach((orb, index) => {
            const speed = 0.5 + (index * 0.1);
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

// Smooth scrolling for anchor links
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Performance optimizations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
        }
    });
}, observerOptions);

// Observe elements for animations
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.repo-card, .about-content');
    animatedElements.forEach(el => observer.observe(el));
});

// Error handling for failed requests
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatRelativeTime,
        getLanguageColor,
        applyFilters,
        sortRepositories
    };
}