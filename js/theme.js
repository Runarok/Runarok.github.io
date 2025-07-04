// Theme management
const ThemeManager = {
    initialize() {
        const saved = localStorage.getItem('github-theme');
        if (saved && CONFIG.themes.includes(saved)) {
            state.currentTheme = CONFIG.themes.indexOf(saved);
        }
        this.apply();
        this.updateIcon();
        this.updateDropdown();
    },

    apply() {
        document.body.className = CONFIG.themes[state.currentTheme];
        localStorage.setItem('github-theme', CONFIG.themes[state.currentTheme]);
    },

    updateIcon() {
        const icons = {
            'theme-dark': 'fas fa-moon',
            'theme-light': 'fas fa-sun',
            'theme-purple': 'fas fa-magic',
            'theme-ocean': 'fas fa-water',
            'theme-forest': 'fas fa-leaf'
        };
        
        const currentTheme = CONFIG.themes[state.currentTheme];
        elements.themeToggle.innerHTML = `<i class="${icons[currentTheme]}"></i>`;
    },

    updateDropdown() {
        elements.themeOptions.forEach(option => {
            const isActive = option.dataset.theme === CONFIG.themes[state.currentTheme];
            option.classList.toggle('active', isActive);
        });
    },

    toggle() {
        state.currentTheme = (state.currentTheme + 1) % CONFIG.themes.length;
        this.apply();
        this.updateIcon();
        this.updateDropdown();
    },

    select(themeName) {
        state.currentTheme = CONFIG.themes.indexOf(themeName);
        this.apply();
        this.updateIcon();
        this.updateDropdown();
        this.hideDropdown();
    },

    showDropdown() {
        elements.themeDropdown.classList.add('show');
        document.addEventListener('click', this.handleOutsideClick);
    },

    hideDropdown() {
        elements.themeDropdown.classList.remove('show');
        document.removeEventListener('click', this.handleOutsideClick);
    },

    handleOutsideClick(e) {
        if (!elements.themeDropdown.contains(e.target) && !elements.themeToggle.contains(e.target)) {
            ThemeManager.hideDropdown();
        }
    }
};