// API management
const APIManager = {
    // Load user data with caching
    async loadUserData() {
        try {
            // Check cache first
            const cached = CacheManager.get('github_user_data');
            if (cached) {
                this.updateUserStats(cached);
                await this.updateAvatar(cached);
                return;
            }

            const response = await fetch(`${CONFIG.apiBase}/users/${CONFIG.username}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const userData = await response.json();
            
            // Cache the data
            CacheManager.set('github_user_data', userData);
            
            this.updateUserStats(userData);
            await this.updateAvatar(userData);
        } catch (error) {
            console.error('Error loading user data:', error);
            // Use fallback values
            this.updateUserStats({ public_repos: 0, followers: 0, following: 0 });
        }
    },

    updateUserStats(userData) {
        this.animateCounter(elements.repoCount, userData.public_repos || 0);
        this.animateCounter(elements.followerCount, userData.followers || 0);
        this.animateCounter(elements.followingCount, userData.following || 0);
    },

    async updateAvatar(userData) {
        if (userData.avatar_url) {
            try {
                // Cache the avatar image
                const cachedImage = await CacheManager.cacheImage(
                    userData.avatar_url, 
                    'github_user_avatar'
                );
                elements.userAvatar.src = cachedImage;
                elements.userAvatar.alt = userData.name || userData.login || 'Runarok Hrafn';
            } catch (error) {
                console.error('Error caching avatar:', error);
                // Fallback to original URL
                elements.userAvatar.src = userData.avatar_url;
            }
        }
    },

    animateCounter(element, target) {
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
    },

    // Load repositories with caching
    async loadRepositories() {
        if (state.isLoading) return;
        
        state.isLoading = true;
        UIManager.showLoading();
        
        try {
            // Check cache first
            const cached = CacheManager.get('github_repositories');
            if (cached) {
                state.allRepos = cached;
                this.processRepositories();
                return;
            }

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
            
            // Cache the repositories
            CacheManager.set('github_repositories', allRepos);
            
            state.allRepos = allRepos;
            this.processRepositories();
            
        } catch (error) {
            console.error('Error loading repositories:', error);
            UIManager.showError('Failed to load repositories. Please try again later.');
        } finally {
            state.isLoading = false;
            UIManager.hideLoading();
        }
    },

    processRepositories() {
        // Update language filter
        UIManager.updateLanguageFilter();
        
        // Apply filters and display
        UIManager.applyFilters();
    }
};