// newsUtils.js
/**
 * Utility functions for news-related operations
 */

/**
 * Format date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Format date for relative time display (e.g., "2 hours ago")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }

    return formatDate(dateString);
};

/**
 * Get category display color
 * @param {string} category - News category
 * @returns {string} CSS color class
 */
export const getCategoryColor = (category) => {
    const categoryColors = {
        market: 'text-green-500',
        stocks: 'text-blue-500',
        economy: 'text-red-500',
        technology: 'text-purple-500',
        crypto: 'text-yellow-500',
    };

    return categoryColors[category] || 'text-gray-500';
};

/**
 * Get category background color
 * @param {string} category - News category
 * @returns {string} CSS background color class
 */
export const getCategoryBgColor = (category) => {
    const categoryBgColors = {
        market: 'bg-green-100 text-green-800',
        stocks: 'bg-blue-100 text-blue-800',
        economy: 'bg-red-100 text-red-800',
        technology: 'bg-purple-100 text-purple-800',
        crypto: 'bg-yellow-100 text-yellow-800',
    };

    return categoryBgColors[category] || 'bg-gray-100 text-gray-800';
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
};

/**
 * Validate news article object
 * @param {Object} article - News article object
 * @returns {boolean} Whether article is valid
 */
export const validateNewsArticle = (article) => {
    const requiredFields = ['id', 'title', 'summary', 'category', 'publishedAt', 'source'];
    return requiredFields.every(field => article && article[field]);
};

/**
 * Sort articles by different criteria
 * @param {Array} articles - Array of news articles
 * @param {string} sortBy - Sort criteria ('date', 'title', 'category')
 * @param {string} order - Sort order ('asc', 'desc')
 * @returns {Array} Sorted articles array
 */
export const sortArticles = (articles, sortBy = 'date', order = 'desc') => {
    const sortedArticles = [...articles];

    sortedArticles.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
            case 'date':
                aValue = new Date(a.publishedAt);
                bValue = new Date(b.publishedAt);
                break;
            case 'title':
                aValue = a.title.toLowerCase();
                bValue = b.title.toLowerCase();
                break;
            case 'category':
                aValue = a.category.toLowerCase();
                bValue = b.category.toLowerCase();
                break;
            default:
                return 0;
        }

        if (order === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });

    return sortedArticles;
};
