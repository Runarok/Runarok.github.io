// Cache management utilities
const CacheManager = {
    // Check if data is expired
    isExpired(timestamp) {
        return Date.now() - timestamp > CONFIG.cacheExpiry;
    },

    // Get cached data
    get(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            if (this.isExpired(data.timestamp)) {
                localStorage.removeItem(key);
                return null;
            }
            
            return data.value;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },

    // Set cached data
    set(key, value) {
        try {
            const data = {
                value,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    },

    // Clear specific cache
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Cache remove error:', error);
        }
    },

    // Clear all cache
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('github_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    },

    // Convert image to base64 and cache it
    async cacheImage(url, cacheKey) {
        try {
            const cached = this.get(cacheKey);
            if (cached) return cached;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result;
                    this.set(cacheKey, base64);
                    resolve(base64);
                };
                reader.onerror = () => resolve(url); // Fallback to original URL
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Image cache error:', error);
            return url; // Fallback to original URL
        }
    }
};

// Detect hard refresh and clear cache
window.addEventListener('beforeunload', (e) => {
    // Check if it's a hard refresh (Ctrl+Shift+R or Ctrl+F5)
    if (e.ctrlKey && e.shiftKey) {
        CacheManager.clear();
    }
});

// Also detect hard refresh on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if page was loaded with hard refresh
    if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
        const entries = performance.getEntriesByType('navigation');
        if (entries.length > 0 && entries[0].type === 'reload') {
            // This might be a hard refresh, but we can't be 100% sure
            // We'll rely on the beforeunload event for more accurate detection
        }
    }
});