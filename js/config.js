// Configuration
const CONFIG = {
    username: 'Runarok',
    apiBase: 'https://api.github.com',
    reposPerPage: 30,
    themes: ['theme-dark', 'theme-light', 'theme-purple', 'theme-ocean', 'theme-forest'],
    cacheExpiry: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
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

// DOM elements cache
const elements = {};