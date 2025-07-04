// UI management
const UIManager = {
    showLoading() {
        elements.loading.style.display = 'flex';
    },

    hideLoading() {
        elements.loading.style.display = 'none';
    },

    showError(message) {
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
    },

    updateLanguageFilter() {
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
    },

    applyFilters() {
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
        this.displayRepositories();
        
        // Update pagination
        this.updatePagination();
        
        // Update clear search button
        elements.clearSearch.style.display = searchTerm ? 'block' : 'none';
    },

    displayRepositories() {
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
        
        elements.repoGrid.innerHTML = pageRepos.map(this.createRepoCard).join('');
        elements.repoGrid.classList.toggle('list-view', state.currentView === 'list');
        
        // Add click events
        this.addRepoCardEvents();
    },

    createRepoCard(repo) {
        const description = repo.description || 'No description available';
        const languageColor = LANGUAGE_COLORS[repo.language] || '#6e7681';
        const updatedDate = UIManager.formatRelativeTime(repo.updated_at);
        
        // Create badges
        let badges = `<span class="repo-badge ${repo.private ? 'private' : 'public'}">${repo.private ? 'Private' : 'Public'}</span>`;
        
        // Create links - only GitHub link
        let links = `<a href="${repo.html_url}" target="_blank" class="repo-link" onclick="event.stopPropagation()">
            <i class="fab fa-github"></i> View Code
        </a>`;
        
        // Add homepage link if available
        if (repo.homepage) {
            links += `<a href="${repo.homepage}" target="_blank" class="repo-link" onclick="event.stopPropagation()">
                <i class="fas fa-globe"></i> Live Demo
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
    },

    addRepoCardEvents() {
        document.querySelectorAll('.repo-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('a')) return;
                window.open(card.dataset.url, '_blank');
            });
        });
    },

    updatePagination() {
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
        this.updatePageNumbers();
    },

    updatePageNumbers() {
        const maxVisible = 5;
        let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(state.totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        let html = '';
        
        // First page and ellipsis
        if (startPage > 1) {
            html += this.createPageNumber(1);
            if (startPage > 2) html += '<span class="page-number">...</span>';
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            html += this.createPageNumber(i);
        }
        
        // Last page and ellipsis
        if (endPage < state.totalPages) {
            if (endPage < state.totalPages - 1) html += '<span class="page-number">...</span>';
            html += this.createPageNumber(state.totalPages);
        }
        
        elements.pageNumbers.innerHTML = html;
        
        // Add click events
        elements.pageNumbers.querySelectorAll('.page-number[data-page]').forEach(btn => {
            btn.addEventListener('click', () => this.goToPage(parseInt(btn.dataset.page)));
        });
    },

    createPageNumber(pageNum) {
        const isActive = pageNum === state.currentPage;
        return `<span class="page-number ${isActive ? 'active' : ''}" data-page="${pageNum}">${pageNum}</span>`;
    },

    goToPage(page) {
        state.currentPage = page;
        this.displayRepositories();
        this.updatePagination();
        this.scrollToSection('repo-section');
    },

    formatRelativeTime(dateString) {
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
    },

    clearSearch() {
        elements.searchInput.value = '';
        this.applyFilters();
        elements.searchInput.focus();
    },

    setView(view) {
        state.currentView = view;
        elements.viewBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        this.displayRepositories();
    },

    scrollToSection(id) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};