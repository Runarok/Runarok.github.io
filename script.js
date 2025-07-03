// Configuration
const CONFIG = {
    username: 'Runarok',
    apiBase: 'https://api.github.com',
    reposPerPage: 30,
    themes: ['theme-dark', 'theme-light', 'theme-purple', 'theme-ocean', 'theme-forest']
};

// Language colors
const LANGUAGE_COLORS = {
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
    Angular: '#DD0031',
    Shell: '#89e051',
    PowerShell: '#012456',
    Dockerfile: '#384d54'
};

// Global state
const state = {
    allRepos: [],
    filteredRepos: [],
    currentPage: 1,
    totalPages: 1,
    currentTheme: 0,
    currentView: 'grid',
    isLoading: false
};

// DOM elements
const elements = {};

// Initialize app
document.addEventListener('DOMContentLoaded', init);

function init() {
    cacheElements();
    initializeTheme();
    setupEventListeners();
    handleUrlParams();
    loadUserData();
    loadRepositories();
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

// Theme management
function initializeTheme() {
    const saved = localStorage.getItem('github-theme');
    if (saved && CONFIG.themes.includes(saved)) {
        state.currentTheme = CONFIG.themes.indexOf(saved);
    }
    applyTheme();
    updateThemeIcon();
    updateThemeDropdown();
}

function applyTheme() {
    document.body.className = CONFIG.themes[state.currentTheme];
    localStorage.setItem('github-theme', CONFIG.themes[state.currentTheme]);
}

function updateThemeIcon() {
    const icons = {
        'theme-dark': 'fas fa-moon',
        'theme-light': 'fas fa-sun',
        'theme-purple': 'fas fa-magic',
        'theme-ocean': 'fas fa-water',
        'theme-forest': 'fas fa-leaf'
    };
    
    const currentTheme = CONFIG.themes[state.currentTheme];
    elements.themeToggle.innerHTML = `<i class="${icons[currentTheme]}"></i>`;
}

function updateThemeDropdown() {
    elements.themeOptions.forEach(option => {
        const isActive = option.dataset.theme === CONFIG.themes[state.currentTheme];
        option.classList.toggle('active', isActive);
    });
}

function toggleTheme() {
    state.currentTheme = (state.currentTheme + 1) % CONFIG.themes.length;
    applyTheme();
    updateThemeIcon();
    updateThemeDropdown();
}

function selectTheme(themeName) {
    state.currentTheme = CONFIG.themes.indexOf(themeName);
    applyTheme();
    updateThemeIcon();
    updateThemeDropdown();
    hideThemeDropdown();
}

function showThemeDropdown() {
    elements.themeDropdown.classList.add('show');
    document.addEventListener('click', handleOutsideClick);
}

function hideThemeDropdown() {
    elements.themeDropdown.classList.remove('show');
    document.removeEventListener('click', handleOutsideClick);
}

function handleOutsideClick(e) {
    if (!elements.themeDropdown.contains(e.target) && !elements.themeToggle.contains(e.target)) {
        hideThemeDropdown();
    }
}

// URL parameter handling
function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    
    if (page === 'about') {
        setTimeout(() => scrollToSection('about-section'), 100);
    } else if (page === 'repo') {
        setTimeout(() => scrollToSection('repo-section'), 100);
    }
}

function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// User data loading
async function loadUserData() {
    try {
        const response = await fetch(`${CONFIG.apiBase}/users/${CONFIG.username}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const userData = await response.json();
        updateUserStats(userData);
        updateAvatar(userData);
    } catch (error) {
        console.error('Error loading user data:', error);
        // Use fallback values
        updateUserStats({ public_repos: 0, followers: 0, following: 0 });
    }
}

function updateUserStats(userData) {
    animateCounter(elements.repoCount, userData.public_repos || 0);
    animateCounter(elements.followerCount, userData.followers || 0);
    animateCounter(elements.followingCount, userData.following || 0);
}

function updateAvatar(userData) {
    if (userData.avatar_url) {
        elements.userAvatar.src = userData.avatar_url;
        elements.userAvatar.alt = userData.name || userData.login || 'Runarok Hrafn';
    }
}

function animateCounter(element, target) {
    const duration = 2000;
    const start = performance.now();
    const startValue = 0;
    
    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(startValue + (target - startValue) * eased);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Repository loading
async function loadRepositories() {
    if (state.isLoading) return;
    
    state.isLoading = true;
    showLoading();
    
    try {
        let allRepos = [];
        let page = 1;
        const maxPages = 10; // Prevent excessive API calls
        
        while (page <= maxPages) {
            const response = await fetch(
                `${CONFIG.apiBase}/users/${CONFIG.username}/repos?per_page=100&page=${page}&sort=updated`
            );
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const repos = await response.json();
            if (repos.length === 0) break;
            
            allRepos = [...allRepos, ...repos];
            if (repos.length < 100) break;
            page++;
        }
        
        state.allRepos = allRepos;
        
        // Detect GitHub Pages
        await detectGitHubPages();
        
        // Update language filter
        updateLanguageFilter();
        
        // Apply filters and display
        applyFilters();
        
    } catch (error) {
        console.error('Error loading repositories:', error);
        showError('Failed to load repositories. Please try again later.');
    } finally {
        state.isLoading = false;
        hideLoading();
    }
}

async function detectGitHubPages() {
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < state.allRepos.length; i += batchSize) {
        batches.push(state.allRepos.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
        const promises = batch.map(async (repo) => {
            try {
                const response = await fetch(`${CONFIG.apiBase}/repos/${CONFIG.username}/${repo.name}/pages`);
                if (response.ok) {
                    const pagesData = await response.json();
                    repo.pages_url = pagesData.html_url;
                    repo.has_pages = true;
                } else {
                    repo.has_pages = false;
                }
            } catch (error) {
                repo.has_pages = false;
            }
            return repo;
        });
        
        await Promise.allSettled(promises);
        
        // Small delay between batches
        if (batch !== batches[batches.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

function updateLanguageFilter() {
    const languages = new Set();
    state.allRepos.forEach(repo => {
        if (repo.language) languages.add(repo.language);
    });
    
    const currentValue = elements.languageFilter.value;
    elements.languageFilter.innerHTML = '<option value="">All Languages</option>';
    
    Array.from(languages).sort().forEach(language => {
        const option = document.createElement('option');
        option.value = language;
        option.textContent = language;
        elements.languageFilter.appendChild(option);
    });
    
    elements.languageFilter.value = currentValue;
}

function applyFilters() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    const selectedLanguage = elements.languageFilter.value;
    const sortBy = elements.sortFilter.value;
    const order = elements.orderFilter.value;
    
    // Filter repositories
    state.filteredRepos = state.allRepos.filter(repo => {
        const matchesSearch = !searchTerm || 
            repo.name.toLowerCase().includes(searchTerm) || 
            (repo.description && repo.description.toLowerCase().includes(searchTerm)) ||
            (repo.topics && repo.topics.some(topic => topic.toLowerCase().includes(searchTerm)));
        
        const matchesLanguage = !selectedLanguage || repo.language === selectedLanguage;
        
        return matchesSearch && matchesLanguage;
    });
    
    // Sort repositories
    state.filteredRepos.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'stars':
                comparison = b.stargazers_count - a.stargazers_count;
                break;
            case 'created':
                comparison = new Date(b.created_at) - new Date(a.created_at);
                break;
            case 'updated':
            default:
                comparison = new Date(b.updated_at) - new Date(a.updated_at);
                break;
        }
        
        return order === 'asc' ? comparison : -comparison;
    });
    
    // Calculate pagination
    state.totalPages = Math.ceil(state.filteredRepos.length / CONFIG.reposPerPage);
    state.currentPage = Math.min(state.currentPage, state.totalPages || 1);
    
    // Display repositories
    displayRepositories();
    
    // Update pagination
    updatePagination();
    
    // Update clear search button
    elements.clearSearch.style.display = searchTerm ? 'block' : 'none';
}

function displayRepositories() {
    if (state.filteredRepos.length === 0) {
        elements.repoGrid.innerHTML = `
            <div class="no-repos">
                <i class="fas fa-search"></i>
                <h3>No repositories found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    const startIndex = (state.currentPage - 1) * CONFIG.reposPerPage;
    const endIndex = startIndex + CONFIG.reposPerPage;
    const pageRepos = state.filteredRepos.slice(startIndex, endIndex);
    
    elements.repoGrid.innerHTML = pageRepos.map(createRepoCard).join('');
    elements.repoGrid.classList.toggle('list-view', state.currentView === 'list');
    
    // Add click events
    addRepoCardEvents();
}

function createRepoCard(repo) {
    const description = repo.description || 'No description available';
    const languageColor = LANGUAGE_COLORS[repo.language] || '#6e7681';
    const updatedDate = formatRelativeTime(repo.updated_at);
    
    // Create badges
    let badges = `<span class="repo-badge ${repo.private ? 'private' : 'public'}">${repo.private ? 'Private' : 'Public'}</span>`;
    if (repo.has_pages) {
        badges += `<span class="repo-badge pages">Pages</span>`;
    }
    
    // Create links
    let links = `<a href="${repo.html_url}" target="_blank" class="repo-link" onclick="event.stopPropagation()">
        <i class="fab fa-github"></i> View Code
    </a>`;
    
    if (repo.has_pages && repo.pages_url) {
        links += `<a href="${repo.pages_url}" target="_blank" class="repo-link" onclick="event.stopPropagation()">
            <i class="fas fa-external-link-alt"></i> Live Site
        </a>`;
    }
    
    return `
        <div class="repo-card" data-url="${repo.html_url}">
            <div class="repo-header">
                <h3 class="repo-title">
                    <i class="fas fa-code-branch"></i>
                    ${repo.name}
                </h3>
                <div class="repo-badges">${badges}</div>
            </div>
            
            <p class="repo-description">${description}</p>
            
            <div class="repo-links">${links}</div>
            
            <div class="repo-meta">
                ${repo.language ? `
                    <span>
                        <span class="language-dot" style="background-color: ${languageColor}"></span>
                        ${repo.language}
                    </span>
                ` : ''}
                <span><i class="fas fa-star"></i> ${repo.stargazers_count.toLocaleString()}</span>
                <span><i class="fas fa-code-branch"></i> ${repo.forks_count.toLocaleString()}</span>
                <span class="repo-updated">Updated ${updatedDate}</span>
            </div>
        </div>
    `;
}

function addRepoCardEvents() {
    document.querySelectorAll('.repo-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            window.open(card.dataset.url, '_blank');
        });
    });
}

function updatePagination() {
    if (state.totalPages <= 1) {
        elements.pagination.style.display = 'none';
        return;
    }
    
    elements.pagination.style.display = 'flex';
    
    // Update info
    const startItem = (state.currentPage - 1) * CONFIG.reposPerPage + 1;
    const endItem = Math.min(state.currentPage * CONFIG.reposPerPage, state.filteredRepos.length);
    elements.paginationInfo.textContent = `${startItem}-${endItem} of ${state.filteredRepos.length} repositories`;
    
    // Update buttons
    elements.prevBtn.disabled = state.currentPage === 1;
    elements.nextBtn.disabled = state.currentPage === state.totalPages;
    
    // Update page numbers
    updatePageNumbers();
}

function updatePageNumbers() {
    const maxVisible = 5;
    let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(state.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    let html = '';
    
    // First page and ellipsis
    if (startPage > 1) {
        html += createPageNumber(1);
        if (startPage > 2) html += '<span class="page-number">...</span>';
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        html += createPageNumber(i);
    }
    
    // Last page and ellipsis
    if (endPage < state.totalPages) {
        if (endPage < state.totalPages - 1) html += '<span class="page-number">...</span>';
        html += createPageNumber(state.totalPages);
    }
    
    elements.pageNumbers.innerHTML = html;
    
    // Add click events
    elements.pageNumbers.querySelectorAll('.page-number[data-page]').forEach(btn => {
        btn.addEventListener('click', () => goToPage(parseInt(btn.dataset.page)));
    });
}

function createPageNumber(pageNum) {
    const isActive = pageNum === state.currentPage;
    return `<span class="page-number ${isActive ? 'active' : ''}" data-page="${pageNum}">${pageNum}</span>`;
}

function goToPage(page) {
    state.currentPage = page;
    displayRepositories();
    updatePagination();
    scrollToSection('repo-section');
}

// Utility functions
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

function showLoading() {
    elements.loading.style.display = 'flex';
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

function showError(message) {
    elements.repoGrid.innerHTML = `
        <div class="no-repos">
            <i class="fas fa-exclamation-triangle" style="color: var(--error);"></i>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="about-btn" style="margin-top: 20px;">
                <i class="fas fa-refresh"></i> Try Again
            </button>
        </div>
    `;
}

function clearSearch() {
    elements.searchInput.value = '';
    applyFilters();
    elements.searchInput.focus();
}

function setView(view) {
    state.currentView = view;
    elements.viewBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    displayRepositories();
}

// Event listeners
function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', (e) => {
        if (e.shiftKey) {
            e.preventDefault();
            showThemeDropdown();
        } else {
            toggleTheme();
        }
    });
    
    // Theme dropdown
    elements.themeDropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.theme-option');
        if (option) selectTheme(option.dataset.theme);
    });
    
    // Search
    let searchTimeout;
    elements.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.currentPage = 1;
            applyFilters();
        }, 300);
    });
    
    // Clear search
    elements.clearSearch.addEventListener('click', clearSearch);
    
    // Filters
    [elements.languageFilter, elements.sortFilter, elements.orderFilter].forEach(filter => {
        filter.addEventListener('change', () => {
            state.currentPage = 1;
            applyFilters();
        });
    });
    
    // View toggles
    elements.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => setView(btn.dataset.view));
    });
    
    // Pagination
    elements.prevBtn.addEventListener('click', () => {
        if (state.currentPage > 1) goToPage(state.currentPage - 1);
    });
    
    elements.nextBtn.addEventListener('click', () => {
        if (state.currentPage < state.totalPages) goToPage(state.currentPage + 1);
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
                    showThemeDropdown();
                } else {
                    toggleTheme();
                }
                break;
            case 'escape':
                hideThemeDropdown();
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

// Scroll effects
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
    window.debug = { state, elements, CONFIG };
}