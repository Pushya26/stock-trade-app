// realTimeNewsAggregator.js
// Enhanced real-time news aggregation service

import axios from 'axios';
import { fetchFreeNews } from './rssFeedParser';

class RealTimeNewsAggregator {
    constructor() {
        this.cache = new Map();
        this.lastFetch = 0;
        this.cacheDuration = parseInt(process.env.REACT_APP_NEWS_CACHE_DURATION) || 600000; // 10 minutes
        this.maxArticles = parseInt(process.env.REACT_APP_NEWS_MAX_ARTICLES) || 50;
        this.rateLimiter = new Map();
    }

    // Main method to get real-time news
    async getLatestNews() {
        try {
            // Check cache first
            if (this.isCacheValid()) {
                console.log('Returning cached news data');
                return this.cache.get('news');
            }

            console.log('Fetching fresh news data...');

            // Fetch from multiple sources in parallel
            const sources = await this.fetchFromAllSources();

            // Merge and deduplicate articles
            const mergedArticles = this.mergeAndDeduplicate(sources);

            // Sort by relevance and recency
            const sortedArticles = this.sortByRelevanceAndTime(mergedArticles);

            // Limit to max articles
            const finalArticles = sortedArticles.slice(0, this.maxArticles);

            // Update cache
            this.updateCache('news', finalArticles);

            return finalArticles;

        } catch (error) {
            console.error('Error in real-time news aggregation:', error);

            // Return cached data if available, otherwise fallback
            if (this.cache.has('news')) {
                return this.cache.get('news');
            }

            return this.getFallbackNews();
        }
    }

    // Fetch from all configured news sources
    async fetchFromAllSources() {
        const promises = [];

        // NewsAPI
        if (this.canMakeRequest('newsapi')) {
            promises.push(this.fetchFromNewsAPI().catch(err => {
                console.warn('NewsAPI failed:', err.message);
                return [];
            }));
        }

        // Finnhub
        if (this.canMakeRequest('finnhub')) {
            promises.push(this.fetchFromFinnhub().catch(err => {
                console.warn('Finnhub failed:', err.message);
                return [];
            }));
        }

        // Alpha Vantage
        if (this.canMakeRequest('alphavantage')) {
            promises.push(this.fetchFromAlphaVantage().catch(err => {
                console.warn('Alpha Vantage failed:', err.message);
                return [];
            }));
        }

        // Free RSS feeds (always available)
        promises.push(fetchFreeNews().catch(err => {
            console.warn('RSS feeds failed:', err.message);
            return [];
        }));

        const results = await Promise.all(promises);
        return results.filter(result => result.length > 0);
    }

    // Enhanced NewsAPI fetch with better error handling
    async fetchFromNewsAPI() {
        const apiKey = process.env.REACT_APP_NEWS_API_KEY;
        if (!apiKey || apiKey === 'your_newsapi_key_here') {
            throw new Error('NewsAPI key not configured');
        }

        this.recordRequest('newsapi');

        const response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
                q: '(stock OR market OR finance OR economy OR trading OR investment) AND (money OR financial OR profit OR earnings)',
                domains: [
                    'bloomberg.com',
                    'reuters.com',
                    'cnbc.com',
                    'marketwatch.com',
                    'wsj.com',
                    'ft.com',
                    'businessinsider.com',
                    'yahoo.com'
                ].join(','),
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: 20,
                apiKey: apiKey
            },
            timeout: 10000
        });

        return response.data.articles.map(article => ({
            id: `newsapi_${Date.now()}_${Math.random()}`,
            title: this.cleanTitle(article.title),
            summary: this.cleanSummary(article.description || article.content),
            category: this.categorizeArticle(article.title + ' ' + article.description),
            author: article.author || article.source.name,
            publishedAt: article.publishedAt,
            url: article.url,
            imageUrl: article.urlToImage || this.getPlaceholderImage(),
            source: article.source.name,
            content: article.content,
            relevanceScore: this.calculateRelevanceScore(article)
        }));
    }

    // Enhanced Finnhub fetch
    async fetchFromFinnhub() {
        const apiKey = process.env.REACT_APP_FINNHUB_KEY;
        if (!apiKey || apiKey === 'your_finnhub_key_here') {
            throw new Error('Finnhub key not configured');
        }

        this.recordRequest('finnhub');

        const response = await axios.get('https://finnhub.io/api/v1/news', {
            params: {
                category: 'general',
                token: apiKey
            },
            timeout: 10000
        });

        return response.data.slice(0, 15).map(article => ({
            id: `finnhub_${article.id || Date.now()}_${Math.random()}`,
            title: this.cleanTitle(article.headline),
            summary: this.cleanSummary(article.summary),
            category: 'market',
            author: article.source,
            publishedAt: new Date(article.datetime * 1000).toISOString(),
            url: article.url,
            imageUrl: article.image || this.getPlaceholderImage(),
            source: article.source,
            content: article.summary,
            relevanceScore: this.calculateRelevanceScore(article)
        }));
    }

    // Enhanced Alpha Vantage fetch
    async fetchFromAlphaVantage() {
        const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_KEY;
        if (!apiKey || apiKey === 'your_alpha_vantage_key_here') {
            throw new Error('Alpha Vantage key not configured');
        }

        this.recordRequest('alphavantage');

        const response = await axios.get('https://www.alphavantage.co/query', {
            params: {
                function: 'NEWS_SENTIMENT',
                apikey: apiKey,
                limit: 20,
                sort: 'LATEST'
            },
            timeout: 15000
        });

        if (response.data.feed) {
            return response.data.feed.map(article => ({
                id: `alphavantage_${Date.now()}_${Math.random()}`,
                title: this.cleanTitle(article.title),
                summary: this.cleanSummary(article.summary),
                category: this.categorizeArticle(article.title + ' ' + article.summary),
                author: article.authors?.[0] || article.source,
                publishedAt: this.parseAlphaVantageDate(article.time_published),
                url: article.url,
                imageUrl: article.banner_image || this.getPlaceholderImage(),
                source: article.source,
                content: article.summary,
                relevanceScore: this.calculateRelevanceScore(article),
                sentiment: article.overall_sentiment_score
            }));
        }
        return [];
    }

    // Merge articles from different sources and remove duplicates
    mergeAndDeduplicate(articleArrays) {
        const allArticles = articleArrays.flat();
        const seen = new Map();
        const unique = [];

        for (const article of allArticles) {
            // Create a fingerprint for duplicate detection
            const fingerprint = this.createArticleFingerprint(article);

            if (!seen.has(fingerprint)) {
                seen.set(fingerprint, true);
                unique.push(article);
            }
        }

        return unique;
    }

    // Create a unique fingerprint for articles to detect duplicates
    createArticleFingerprint(article) {
        // Use first 100 characters of title + source
        const titlePart = article.title.toLowerCase().substring(0, 100);
        const sourcePart = article.source.toLowerCase();
        return `${titlePart}_${sourcePart}`;
    }

    // Sort articles by relevance and time
    sortByRelevanceAndTime(articles) {
        return articles.sort((a, b) => {
            // First sort by relevance score (if available)
            if (a.relevanceScore && b.relevanceScore) {
                const relevanceDiff = b.relevanceScore - a.relevanceScore;
                if (Math.abs(relevanceDiff) > 0.1) {
                    return relevanceDiff;
                }
            }

            // Then by publication time (newer first)
            return new Date(b.publishedAt) - new Date(a.publishedAt);
        });
    }

    // Calculate relevance score based on financial keywords
    calculateRelevanceScore(article) {
        const text = (article.title + ' ' + (article.summary || article.description || '')).toLowerCase();

        const highValueKeywords = [
            'earnings', 'revenue', 'profit', 'stock price', 'market cap',
            'ipo', 'merger', 'acquisition', 'dividend', 'federal reserve'
        ];

        const mediumValueKeywords = [
            'stock', 'market', 'trading', 'investment', 'finance',
            'economy', 'inflation', 'interest rate', 'gdp'
        ];

        let score = 0;

        highValueKeywords.forEach(keyword => {
            if (text.includes(keyword)) score += 3;
        });

        mediumValueKeywords.forEach(keyword => {
            if (text.includes(keyword)) score += 1;
        });

        // Boost score for recent articles
        const hoursOld = (Date.now() - new Date(article.publishedAt)) / (1000 * 60 * 60);
        if (hoursOld < 1) score += 2;
        else if (hoursOld < 6) score += 1;

        return score;
    }

    // Clean and format article titles
    cleanTitle(title) {
        if (!title) return 'Untitled';

        // Remove site names from end of titles
        const cleaned = title.replace(/\s*-\s*[A-Z][a-zA-Z\s]*\.com.*$/, '')
            .replace(/\s*\|\s*[A-Z][a-zA-Z\s]*$/, '')
            .trim();

        return cleaned || title;
    }

    // Clean and format article summaries
    cleanSummary(summary) {
        if (!summary) return '';

        // Remove HTML tags and clean up text
        const cleaned = summary.replace(/<[^>]*>/g, '')
            .replace(/&[a-zA-Z]+;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Limit length
        return cleaned.length > 300 ? cleaned.substring(0, 300) + '...' : cleaned;
    }

    // Categorize articles based on content
    categorizeArticle(text) {
        const lowerText = text.toLowerCase();

        if (lowerText.match(/crypto|bitcoin|ethereum|blockchain/)) return 'crypto';
        if (lowerText.match(/tech|apple|microsoft|google|tesla|ai|artificial intelligence/)) return 'technology';
        if (lowerText.match(/federal reserve|fed|inflation|gdp|unemployment|interest rate/)) return 'economy';
        if (lowerText.match(/earnings|dividend|ipo|stock price|analyst/)) return 'stocks';

        return 'market';
    }

    // Parse Alpha Vantage date format
    parseAlphaVantageDate(dateString) {
        try {
            // Alpha Vantage format: YYYYMMDDTHHMMSS
            const year = dateString.substring(0, 4);
            const month = dateString.substring(4, 6);
            const day = dateString.substring(6, 8);
            const hour = dateString.substring(9, 11);
            const minute = dateString.substring(11, 13);
            const second = dateString.substring(13, 15);

            return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
    }

    // Rate limiting for API requests
    canMakeRequest(source) {
        const now = Date.now();
        const limits = {
            newsapi: { requests: 100, window: 24 * 60 * 60 * 1000 }, // 100 per day
            finnhub: { requests: 60, window: 60 * 1000 }, // 60 per minute
            alphavantage: { requests: 25, window: 24 * 60 * 60 * 1000 } // 25 per day
        };

        const limit = limits[source];
        if (!limit) return true;

        if (!this.rateLimiter.has(source)) {
            this.rateLimiter.set(source, []);
        }

        const requests = this.rateLimiter.get(source);

        // Remove old requests outside the window
        const validRequests = requests.filter(time => now - time < limit.window);
        this.rateLimiter.set(source, validRequests);

        return validRequests.length < limit.requests;
    }

    // Record a request for rate limiting
    recordRequest(source) {
        if (!this.rateLimiter.has(source)) {
            this.rateLimiter.set(source, []);
        }
        this.rateLimiter.get(source).push(Date.now());
    }

    // Cache management
    isCacheValid() {
        const now = Date.now();
        return this.cache.has('news') && (now - this.lastFetch) < this.cacheDuration;
    }

    updateCache(key, data) {
        this.cache.set(key, data);
        this.lastFetch = Date.now();
    }

    clearCache() {
        this.cache.clear();
        this.lastFetch = 0;
    }

    // Fallback news when all sources fail
    getFallbackNews() {
        return [
            {
                id: 'fallback_1',
                title: 'Markets Show Mixed Performance Amid Economic Uncertainty',
                summary: 'Financial markets display varied performance as investors navigate current economic indicators and policy changes.',
                category: 'market',
                author: 'Market Analysis',
                publishedAt: new Date().toISOString(),
                url: '#',
                imageUrl: this.getPlaceholderImage(),
                source: 'Market Summary',
                content: 'Fallback content when news sources are unavailable.'
            }
        ];
    }

    getPlaceholderImage() {
        return 'https://via.placeholder.com/400x200/1e293b/white?text=Financial+News';
    }
}

// Export singleton instance
const aggregatorInstance = new RealTimeNewsAggregator();
export default aggregatorInstance;
