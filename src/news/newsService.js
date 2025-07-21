// newsService.js
import axios from 'axios';
import { fetchFreeNews, fetchLSERSSNews } from './rssFeedParser';
import { FINANCIAL_NEWS_SOURCES, CATEGORY_KEYWORDS } from './newsApiConfig';
import realTimeNewsAggregator from './realTimeNewsAggregator';

// News API configuration
const NEWS_API_CONFIG = {
    // Free tier API keys - replace with your own
    newsApi: {
        key: process.env.REACT_APP_NEWS_API_KEY || 'demo-key',
        baseUrl: 'https://newsapi.org/v2'
    },
    alphaVantage: {
        key: process.env.REACT_APP_ALPHA_VANTAGE_KEY || 'demo-key',
        baseUrl: 'https://www.alphavantage.co/query'
    },
    finnhub: {
        key: process.env.REACT_APP_FINNHUB_KEY || 'demo-key',
        baseUrl: 'https://finnhub.io/api/v1'
    }
};

// Financial news sources
const FINANCIAL_SOURCES = FINANCIAL_NEWS_SOURCES;

// Mock news data for fallback/demo
const mockNewsData = [
    {
        id: 1,
        title: "Stock Market Reaches New Heights as Tech Stocks Surge",
        summary: "Major technology companies see significant gains as investors show renewed confidence in the sector amid positive earnings reports.",
        category: "market",
        author: "John Smith",
        publishedAt: "2025-07-17T09:00:00Z",
        url: "https://example.com/news/1",
        imageUrl: "https://via.placeholder.com/400x200/1e293b/white?text=Market+News",
        source: "Financial Times",
        content: "Full article content would go here..."
    },
    {
        id: 2,
        title: "Apple Reports Strong Q2 Earnings, Beats Expectations",
        summary: "Apple Inc. exceeds analyst expectations with strong iPhone sales and growing services revenue, driving stock price up 5%.",
        category: "stocks",
        author: "Sarah Johnson",
        publishedAt: "2025-07-17T08:30:00Z",
        url: "https://example.com/news/2",
        imageUrl: "https://via.placeholder.com/400x200/059669/white?text=Apple+News",
        source: "Reuters",
        content: "Full article content would go here..."
    },
    {
        id: 3,
        title: "Federal Reserve Signals Potential Interest Rate Changes",
        summary: "Central bank hints at monetary policy adjustments in response to current economic indicators and inflation data.",
        category: "economy",
        author: "Michael Brown",
        publishedAt: "2025-07-17T07:45:00Z",
        url: "https://example.com/news/3",
        imageUrl: "https://via.placeholder.com/400x200/dc2626/white?text=Economy+News",
        source: "Wall Street Journal",
        content: "Full article content would go here..."
    },
    {
        id: 4,
        title: "Tesla Stock Soars on New Autonomous Vehicle Breakthrough",
        summary: "Electric vehicle manufacturer announces major advancement in self-driving technology, promising full autonomy by 2026.",
        category: "technology",
        author: "Lisa Davis",
        publishedAt: "2025-07-17T06:15:00Z",
        url: "https://example.com/news/4",
        imageUrl: "https://via.placeholder.com/400x200/7c3aed/white?text=Tech+News",
        source: "TechCrunch",
        content: "Full article content would go here..."
    },
    {
        id: 5,
        title: "Bitcoin Hits $50,000 as Institutional Adoption Grows",
        summary: "Cryptocurrency markets rally as more institutional investors enter the space, with major banks announcing crypto services.",
        category: "crypto",
        author: "David Wilson",
        publishedAt: "2025-07-17T05:30:00Z",
        url: "https://example.com/news/5",
        imageUrl: "https://via.placeholder.com/400x200/f59e0b/white?text=Crypto+News",
        source: "CoinDesk",
        content: "Full article content would go here..."
    },
    {
        id: 6,
        title: "Amazon Reports Record Q2 Revenue Growth",
        summary: "E-commerce giant sees explosive growth in cloud services and advertising revenue, beating analyst forecasts.",
        category: "stocks",
        author: "Emily Chen",
        publishedAt: "2025-07-17T04:45:00Z",
        url: "https://example.com/news/6",
        imageUrl: "https://via.placeholder.com/400x200/16a34a/white?text=Amazon+News",
        source: "Bloomberg",
        content: "Full article content would go here..."
    },
    {
        id: 7,
        title: "Global Markets React to Inflation Data Release",
        summary: "International markets show mixed reactions to latest inflation figures, with European markets leading gains.",
        category: "market",
        author: "Robert Taylor",
        publishedAt: "2025-07-17T03:20:00Z",
        url: "https://example.com/news/7",
        imageUrl: "https://via.placeholder.com/400x200/0ea5e9/white?text=Global+Markets",
        source: "Reuters",
        content: "Full article content would go here..."
    },
    {
        id: 8,
        title: "Nvidia Announces Next-Generation AI Chips",
        summary: "Graphics processing unit manufacturer unveils revolutionary AI hardware promising 10x performance improvements.",
        category: "technology",
        author: "Alex Martinez",
        publishedAt: "2025-07-17T02:10:00Z",
        url: "https://example.com/news/8",
        imageUrl: "https://via.placeholder.com/400x200/8b5cf6/white?text=Nvidia+AI",
        source: "The Verge",
        content: "Full article content would go here..."
    }
];

class NewsService {
    // Fetch all news articles with enhanced real-time data
    static async fetchNews() {
        try {
            // Use the enhanced real-time aggregator
            const articles = await realTimeNewsAggregator.getLatestNews();

            if (articles && articles.length > 0) {
                console.log(`Fetched ${articles.length} articles from real-time sources`);
                return articles;
            }

            // Fallback to original method if aggregator fails
            return await this.fetchNewsOriginal();

        } catch (error) {
            console.error('Error in enhanced news fetch:', error);
            // Fallback to original method
            return await this.fetchNewsOriginal();
        }
    }

    // Original fetch method as fallback
    static async fetchNewsOriginal() {
        try {
            // Check if any API keys are configured
            const hasApiKeys = this.checkApiKeys();

            if (hasApiKeys) {
                // Try to fetch from premium APIs
                const newsPromises = [
                    this.fetchFromNewsAPI(),
                    this.fetchFromFinnhub(),
                    this.fetchFromAlphaVantage()
                ];

                // Wait for all promises and combine results
                const results = await Promise.allSettled(newsPromises);
                let allArticles = [];

                results.forEach((result, index) => {
                    if (result.status === 'fulfilled' && result.value) {
                        allArticles = [...allArticles, ...result.value];
                    } else {
                        console.warn(`News source ${index + 1} failed:`, result.reason);
                    }
                });

                if (allArticles.length > 0) {
                    // Remove duplicates and sort by date
                    const uniqueArticles = this.removeDuplicates(allArticles);
                    return this.sortNews(uniqueArticles, 'date');
                }
            }

            // Fallback to free RSS feeds
            console.info('Using free RSS feeds as news source');
            const rssArticles = await fetchFreeNews();

            if (rssArticles.length > 0) {
                return rssArticles;
            }

            // Final fallback to mock data
            console.warn('Using mock data as final fallback');
            return mockNewsData;

        } catch (error) {
            console.error('Error fetching news:', error);
            // Fallback to mock data
            return mockNewsData;
        }
    }

    // Check if API keys are configured
    static checkApiKeys() {
        const newsApiKey = NEWS_API_CONFIG.newsApi.key;
        const finnhubKey = NEWS_API_CONFIG.finnhub.key;
        const alphaVantageKey = NEWS_API_CONFIG.alphaVantage.key;

        return (newsApiKey && newsApiKey !== 'demo-key') ||
            (finnhubKey && finnhubKey !== 'demo-key') ||
            (alphaVantageKey && alphaVantageKey !== 'demo-key');
    }

    // Fetch from NewsAPI (General financial news)
    static async fetchFromNewsAPI() {
        try {
            const apiKey = NEWS_API_CONFIG.newsApi.key;
            if (apiKey === 'demo-key') {
                throw new Error('NewsAPI key not configured');
            }

            const response = await axios.get(`${NEWS_API_CONFIG.newsApi.baseUrl}/everything`, {
                params: {
                    q: 'stock market OR finance OR economy OR trading',
                    domains: FINANCIAL_SOURCES.join(','),
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: 20,
                    apiKey: apiKey
                }
            });

            return response.data.articles.map(article => ({
                id: `newsapi_${Date.now()}_${Math.random()}`,
                title: article.title,
                summary: article.description || article.content?.substring(0, 200) + '...',
                category: this.categorizeArticle(article.title + ' ' + article.description),
                author: article.author || article.source.name,
                publishedAt: article.publishedAt,
                url: article.url,
                imageUrl: article.urlToImage || this.getPlaceholderImage('newsapi'),
                source: article.source.name,
                content: article.content
            }));
        } catch (error) {
            console.error('NewsAPI fetch failed:', error);
            return [];
        }
    }

    // Fetch from Finnhub (Stock-specific news)
    static async fetchFromFinnhub() {
        try {
            const apiKey = NEWS_API_CONFIG.finnhub.key;
            if (apiKey === 'demo-key') {
                throw new Error('Finnhub key not configured');
            }

            const response = await axios.get(`${NEWS_API_CONFIG.finnhub.baseUrl}/news`, {
                params: {
                    category: 'general',
                    token: apiKey
                }
            });

            return response.data.slice(0, 15).map(article => ({
                id: `finnhub_${article.id || Date.now()}_${Math.random()}`,
                title: article.headline,
                summary: article.summary,
                category: 'market',
                author: article.source,
                publishedAt: new Date(article.datetime * 1000).toISOString(),
                url: article.url,
                imageUrl: article.image || this.getPlaceholderImage('finnhub'),
                source: article.source,
                content: article.summary
            }));
        } catch (error) {
            console.error('Finnhub fetch failed:', error);
            return [];
        }
    }

    // Fetch from Alpha Vantage (Market news)
    static async fetchFromAlphaVantage() {
        try {
            const apiKey = NEWS_API_CONFIG.alphaVantage.key;
            if (apiKey === 'demo-key') {
                throw new Error('Alpha Vantage key not configured');
            }

            const response = await axios.get(NEWS_API_CONFIG.alphaVantage.baseUrl, {
                params: {
                    function: 'NEWS_SENTIMENT',
                    apikey: apiKey,
                    limit: 20
                }
            });

            if (response.data.feed) {
                return response.data.feed.map(article => ({
                    id: `alphavantage_${Date.now()}_${Math.random()}`,
                    title: article.title,
                    summary: article.summary,
                    category: this.categorizeArticle(article.title + ' ' + article.summary),
                    author: article.authors?.[0] || article.source,
                    publishedAt: article.time_published,
                    url: article.url,
                    imageUrl: article.banner_image || this.getPlaceholderImage('alphavantage'),
                    source: article.source,
                    content: article.summary
                }));
            }
            return [];
        } catch (error) {
            console.error('Alpha Vantage fetch failed:', error);
            return [];
        }
    }

    // Categorize articles based on content using improved algorithm
    static categorizeArticle(text) {
        const lowerText = text.toLowerCase();

        // Check each category with weighted scoring
        const scores = {};
        Object.keys(CATEGORY_KEYWORDS).forEach(category => {
            scores[category] = 0;
            CATEGORY_KEYWORDS[category].forEach(keyword => {
                if (lowerText.includes(keyword.toLowerCase())) {
                    scores[category] += 1;
                }
            });
        });

        // Find category with highest score
        const bestCategory = Object.keys(scores).reduce((a, b) =>
            scores[a] > scores[b] ? a : b
        );

        // Return best category if it has any matches, otherwise default to 'market'
        return scores[bestCategory] > 0 ? bestCategory : 'market';
    }

    // Get placeholder image based on source
    static getPlaceholderImage(source) {
        const colors = {
            newsapi: '1e293b',
            finnhub: '059669',
            alphavantage: 'dc2626'
        };
        const color = colors[source] || '6b7280';
        return `https://via.placeholder.com/400x200/${color}/white?text=Financial+News`;
    }

    // Remove duplicate articles
    static removeDuplicates(articles) {
        const seen = new Set();
        return articles.filter(article => {
            const key = article.title.toLowerCase().substring(0, 50);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // Fetch news by category
    static async fetchNewsByCategory(category) {
        try {
            const allNews = await this.fetchNews();
            if (category === 'all') {
                return allNews;
            }
            return allNews.filter(article => article.category === category);
        } catch (error) {
            console.error('Error fetching news by category:', error);
            throw new Error('Failed to fetch news by category');
        }
    }

    // Search news articles
    static async searchNews(searchTerm) {
        try {
            const allNews = await this.fetchNews();
            const searchLower = searchTerm.toLowerCase();

            return allNews.filter(article =>
                article.title.toLowerCase().includes(searchLower) ||
                article.summary.toLowerCase().includes(searchLower) ||
                article.author.toLowerCase().includes(searchLower) ||
                article.source.toLowerCase().includes(searchLower)
            );
        } catch (error) {
            console.error('Error searching news:', error);
            throw new Error('Failed to search news articles');
        }
    }

    // Get trending news (most recent articles)
    static async getTrendingNews(limit = 5) {
        try {
            const allNews = await this.fetchNews();
            return allNews
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching trending news:', error);
            throw new Error('Failed to fetch trending news');
        }
    }

    // Get news by specific stock symbol
    static async getStockNews(symbol) {
        try {
            const apiKey = NEWS_API_CONFIG.finnhub.key;
            if (apiKey === 'demo-key') {
                // Fallback to general news filtering
                const allNews = await this.fetchNews();
                return allNews.filter(article =>
                    article.title.toLowerCase().includes(symbol.toLowerCase()) ||
                    article.summary.toLowerCase().includes(symbol.toLowerCase())
                );
            }

            const response = await axios.get(`${NEWS_API_CONFIG.finnhub.baseUrl}/company-news`, {
                params: {
                    symbol: symbol,
                    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    to: new Date().toISOString().split('T')[0],
                    token: apiKey
                }
            });

            return response.data.slice(0, 10).map(article => ({
                id: `stock_${symbol}_${article.id || Date.now()}_${Math.random()}`,
                title: article.headline,
                summary: article.summary,
                category: 'stocks',
                author: article.source,
                publishedAt: new Date(article.datetime * 1000).toISOString(),
                url: article.url,
                imageUrl: article.image || this.getPlaceholderImage('finnhub'),
                source: article.source,
                content: article.summary
            }));
        } catch (error) {
            console.error('Error fetching stock news:', error);
            return [];
        }
    }

    // Filter news articles
    static filterNews(articles, { searchTerm, category }) {
        let filtered = [...articles];

        // Filter by category
        if (category && category !== 'all') {
            filtered = filtered.filter(article => article.category === category);
        }

        // Filter by search term
        if (searchTerm && searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(article =>
                article.title.toLowerCase().includes(searchLower) ||
                article.summary.toLowerCase().includes(searchLower) ||
                article.author.toLowerCase().includes(searchLower) ||
                article.source.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }

    // Sort news articles
    static sortNews(articles, sortBy = 'date') {
        switch (sortBy) {
            case 'date':
                return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            case 'title':
                return articles.sort((a, b) => a.title.localeCompare(b.title));
            case 'source':
                return articles.sort((a, b) => a.source.localeCompare(b.source));
            default:
                return articles;
        }
    }

    // Clear news cache for fresh data
    static clearNewsCache() {
        realTimeNewsAggregator.clearCache();
    }

    // Get real-time breaking news (highest priority)
    static async getBreakingNews(limit = 5) {
        try {
            const allNews = await this.fetchNews();
            const now = Date.now();
            const oneHourAgo = now - (60 * 60 * 1000);

            // Filter for very recent news with high relevance
            const breakingNews = allNews
                .filter(article => {
                    const publishedTime = new Date(article.publishedAt).getTime();
                    return publishedTime > oneHourAgo &&
                        (article.relevanceScore > 5 ||
                            article.title.toLowerCase().includes('breaking') ||
                            article.title.toLowerCase().includes('urgent'));
                })
                .slice(0, limit);

            return breakingNews;
        } catch (error) {
            console.error('Error fetching breaking news:', error);
            return [];
        }
    }

    // Get market-moving news for specific timeframe
    static async getMarketMovingNews(hoursBack = 24) {
        try {
            const allNews = await this.fetchNews();
            const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);

            const marketKeywords = [
                'federal reserve', 'interest rate', 'inflation', 'gdp',
                'earnings', 'merger', 'acquisition', 'ipo', 'dividend'
            ];

            return allNews.filter(article => {
                const publishedTime = new Date(article.publishedAt).getTime();
                const content = (article.title + ' ' + article.summary).toLowerCase();

                return publishedTime > cutoffTime &&
                    marketKeywords.some(keyword => content.includes(keyword));
            });
        } catch (error) {
            console.error('Error fetching market-moving news:', error);
            return [];
        }
    }

    // Get personalized news based on user's portfolio (if available)
    static async getPersonalizedNews(userStocks = []) {
        try {
            const allNews = await this.fetchNews();

            if (userStocks.length === 0) {
                return this.getTrendingNews();
            }

            const relevantNews = allNews.filter(article => {
                const content = (article.title + ' ' + article.summary).toLowerCase();
                return userStocks.some(stock =>
                    content.includes(stock.toLowerCase()) ||
                    content.includes(this.getCompanyName(stock).toLowerCase())
                );
            });

            return relevantNews.length > 0 ? relevantNews : this.getTrendingNews();
        } catch (error) {
            console.error('Error fetching personalized news:', error);
            return this.getTrendingNews();
        }
    }

    // Helper to get company name from stock symbol
    static getCompanyName(symbol) {
        const companyMap = {
            'AAPL': 'Apple',
            'MSFT': 'Microsoft',
            'GOOGL': 'Google',
            'AMZN': 'Amazon',
            'TSLA': 'Tesla',
            'META': 'Meta',
            'NVDA': 'Nvidia',
            'NFLX': 'Netflix'
        };
        return companyMap[symbol.toUpperCase()] || symbol;
    }

    // Filter news articles for London Stock Exchange related content
    static filterLSENews(articles) {
        const lseKeywords = CATEGORY_KEYWORDS.lse || [
            'london stock exchange', 'lse', 'ftse 100', 'ftse 250', 'ftse',
            'uk stocks', 'british stocks', 'london market', 'uk market',
            'pounds sterling', 'gbp', 'bank of england', 'boe',
            'uk economy', 'british economy', 'uk earnings', 'uk companies',
            'aim market', 'alternative investment market', 'london listing',
            'uk ipo', 'british pound', 'london trading', 'uk financial'
        ];

        const lseSources = [
            'ft.com', 'financial-times.com', 'thisismoney.co.uk',
            'citywire.co.uk', 'investmentweek.co.uk', 'sharecast.com',
            'proactiveinvestors.co.uk', 'lse.co.uk', 'bbc.com/business',
            'theguardian.com/business', 'telegraph.co.uk/business'
        ];

        return articles.filter(article => {
            const content = `${article.title} ${article.summary || article.description || ''} ${article.content || ''}`.toLowerCase();
            const source = article.source?.toLowerCase() || '';

            // Check if content contains LSE-related keywords
            const hasLSEKeywords = lseKeywords.some(keyword =>
                content.includes(keyword.toLowerCase())
            );

            // Check if source is LSE-focused
            const isLSESource = lseSources.some(lseSource =>
                source.includes(lseSource) || (article.url && article.url.includes(lseSource))
            );

            return hasLSEKeywords || isLSESource;
        });
    }

    // Fetch LSE-specific news
    static async fetchLSENews() {
        try {
            console.log('Fetching LSE-specific news...');

            // Get general news first
            const allNews = await this.fetchNews();

            // Filter for LSE-related content
            const lseNews = this.filterLSENews(allNews);

            console.log(`Filtered ${lseNews.length} LSE-related articles from ${allNews.length} total articles`);

            // If we have LSE news, return it
            if (lseNews.length > 0) {
                return lseNews;
            }

            // If no LSE news found, try to fetch UK-specific news from APIs
            const ukSpecificNews = await this.fetchUKSpecificNews();
            return ukSpecificNews;

        } catch (error) {
            console.error('Error fetching LSE news:', error);
            return this.getLSEMockData();
        }
    }

    // Fetch UK-specific news from APIs
    static async fetchUKSpecificNews() {
        const articles = [];

        try {
            // Try NewsAPI with UK business sources
            if (NEWS_API_CONFIG.newsApi.key && NEWS_API_CONFIG.newsApi.key !== 'demo-key') {
                const ukNewsUrl = `${NEWS_API_CONFIG.newsApi.baseUrl}/everything?` +
                    `q=(FTSE OR "London Stock Exchange" OR "UK stocks" OR "British economy")&` +
                    `sources=bbc-news,the-guardian-uk&` +
                    `language=en&` +
                    `sortBy=publishedAt&` +
                    `apiKey=${NEWS_API_CONFIG.newsApi.key}`;

                const response = await axios.get(ukNewsUrl);
                if (response.data.articles) {
                    articles.push(...response.data.articles.map(this.transformNewsAPIArticle));
                }
            }
        } catch (error) {
            console.warn('Error fetching UK-specific news from NewsAPI:', error.message);
        }

        // Add LSE-specific RSS feeds as primary source
        try {
            const lseRssNews = await fetchLSERSSNews();
            articles.push(...lseRssNews);
        } catch (error) {
            console.warn('Error fetching LSE RSS news:', error.message);
        }

        // Add general RSS fallback for additional UK financial news
        try {
            const rssNews = await fetchFreeNews();
            const ukRssNews = rssNews.filter(article =>
                article.title.toLowerCase().includes('uk') ||
                article.title.toLowerCase().includes('london') ||
                article.title.toLowerCase().includes('ftse') ||
                article.title.toLowerCase().includes('british')
            );
            articles.push(...ukRssNews);
        } catch (error) {
            console.warn('Error fetching general UK RSS news:', error.message);
        }

        return articles.length > 0 ? articles : this.getLSEMockData();
    }

    // Mock LSE data for demo purposes
    static getLSEMockData() {
        return [
            {
                id: 'lse-1',
                title: "FTSE 100 Reaches Record High as UK Economy Shows Strong Growth",
                summary: "London's benchmark index climbed 2.3% following positive GDP data and strong earnings from major UK companies.",
                category: "lse",
                author: "Financial Times",
                publishedAt: new Date().toISOString(),
                url: "https://ft.com/content/ftse-record-high",
                imageUrl: "https://via.placeholder.com/400x200/1e40af/white?text=FTSE+100",
                source: "Financial Times",
                content: "The FTSE 100 index reached a new record high today..."
            },
            {
                id: 'lse-2',
                title: "Bank of England Maintains Interest Rates, Supports UK Market Stability",
                summary: "The BoE held rates steady at 5.25%, citing controlled inflation and stable economic indicators across UK markets.",
                category: "lse",
                author: "Reuters UK",
                publishedAt: new Date(Date.now() - 3600000).toISOString(),
                url: "https://reuters.com/uk-boe-rates",
                imageUrl: "https://via.placeholder.com/400x200/059669/white?text=Bank+of+England",
                source: "Reuters",
                content: "The Bank of England's Monetary Policy Committee..."
            },
            {
                id: 'lse-3',
                title: "London Stock Exchange Announces New Green Bond Listings",
                summary: "LSE reveals plans for expanded sustainable finance offerings, attracting major UK and international green investments.",
                category: "lse",
                author: "This is Money",
                publishedAt: new Date(Date.now() - 7200000).toISOString(),
                url: "https://thisismoney.co.uk/lse-green-bonds",
                imageUrl: "https://via.placeholder.com/400x200/16a34a/white?text=Green+Bonds",
                source: "This is Money",
                content: "The London Stock Exchange has unveiled..."
            }
        ];
    }

    // Get LSE breaking news
    static async getLSEBreakingNews() {
        try {
            const allBreaking = await this.getBreakingNews();
            return this.filterLSENews(allBreaking);
        } catch (error) {
            console.error('Error fetching LSE breaking news:', error);
            return [];
        }
    }

    // Get LSE market-moving news  
    static async getLSEMarketMovingNews() {
        try {
            const allMarketMoving = await this.getMarketMovingNews();
            return this.filterLSENews(allMarketMoving);
        } catch (error) {
            console.error('Error fetching LSE market-moving news:', error);
            return [];
        }
    }
}

export default NewsService;

// Export news categories for use in components
export const NEWS_CATEGORIES = [
    { value: "all", label: "All News" },
    { value: "market", label: "Market News" },
    { value: "stocks", label: "Stock Analysis" },
    { value: "economy", label: "Economic News" },
    { value: "technology", label: "Tech Stocks" },
    { value: "crypto", label: "Cryptocurrency" }
];
