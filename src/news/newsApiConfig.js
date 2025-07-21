// newsApiConfig.js
// Configuration for news API integrations

export const NEWS_API_ENDPOINTS = {
    // NewsAPI - General news aggregator
    newsApi: {
        name: 'NewsAPI',
        baseUrl: 'https://newsapi.org/v2',
        keyRequired: true,
        freeLimit: '100 requests/day',
        signupUrl: 'https://newsapi.org/register',
        description: 'Comprehensive news aggregator with articles from 70,000+ sources'
    },

    // Finnhub - Stock market and financial news
    finnhub: {
        name: 'Finnhub',
        baseUrl: 'https://finnhub.io/api/v1',
        keyRequired: true,
        freeLimit: '60 calls/minute',
        signupUrl: 'https://finnhub.io/register',
        description: 'Real-time stock market data and financial news'
    },

    // Alpha Vantage - Financial market data
    alphaVantage: {
        name: 'Alpha Vantage',
        baseUrl: 'https://www.alphavantage.co/query',
        keyRequired: true,
        freeLimit: '25 requests/day',
        signupUrl: 'https://www.alphavantage.co/support/#api-key',
        description: 'Financial market data with news sentiment analysis'
    },

    // Yahoo Finance (Free alternative - no API key required)
    yahooFinance: {
        name: 'Yahoo Finance RSS',
        baseUrl: 'https://feeds.finance.yahoo.com/rss/2.0',
        keyRequired: false,
        freeLimit: 'Unlimited',
        description: 'RSS feeds from Yahoo Finance'
    }
};

// Financial news sources for better targeting
export const FINANCIAL_NEWS_SOURCES = [
    // Major Financial Publications
    'bloomberg.com',
    'reuters.com',
    'cnbc.com',

    // UK/LSE Specific Sources
    'londonstockexchange.com',
    'ft.com',
    'financial-times.com',
    'thisismoney.co.uk',
    'citywire.co.uk',
    'investmentweek.co.uk',
    'sharecast.com',
    'proactiveinvestors.co.uk',
    'lse.co.uk',
    'bbc.com/business',
    'theguardian.com/business',
    'telegraph.co.uk/business',
    'moneyam.com',
    'iii.co.uk',
    'marketwatch.com',
    'wsj.com',
    'ft.com',
    'financial-times.com',

    // Business Publications
    'businessinsider.com',
    'forbes.com',
    'fortune.com',
    'economist.com',

    // Investment Focused
    'seekingalpha.com',
    'fool.com',
    'thestreet.com',
    'benzinga.com',
    'zacks.com',

    // Tech & Finance
    'techcrunch.com',
    'cnet.com',
    'venturebeat.com'
];

// Keywords for financial news filtering
export const FINANCIAL_KEYWORDS = [
    // Market Terms
    'stock market', 'stocks', 'shares', 'trading', 'investment',
    'portfolio', 'dividend', 'earnings', 'revenue', 'profit',

    // Economic Terms
    'economy', 'economic', 'finance', 'financial', 'market',
    'inflation', 'gdp', 'unemployment', 'interest rate',

    // Company Terms
    'IPO', 'merger', 'acquisition', 'quarterly results',
    'analyst', 'forecast', 'valuation', 'market cap',

    // Sectors
    'technology', 'healthcare', 'energy', 'banking',
    'real estate', 'automotive', 'retail', 'agriculture'
];

// Crypto-specific keywords
export const CRYPTO_KEYWORDS = [
    'bitcoin', 'ethereum', 'cryptocurrency', 'crypto',
    'blockchain', 'defi', 'nft', 'dogecoin', 'litecoin',
    'cardano', 'polkadot', 'chainlink', 'binance'
];

// Category mapping for automatic categorization
export const CATEGORY_KEYWORDS = {
    lse: [
        'london stock exchange', 'lse', 'ftse 100', 'ftse 250', 'ftse',
        'uk stocks', 'british stocks', 'london market', 'uk market',
        'pounds sterling', 'gbp', 'bank of england', 'boe',
        'uk economy', 'british economy', 'uk earnings', 'uk companies',
        'aim market', 'alternative investment market', 'london listing',
        'uk ipo', 'british pound', 'london trading', 'uk financial'
    ],
    technology: [
        'apple', 'microsoft', 'google', 'amazon', 'meta', 'tesla',
        'nvidia', 'amd', 'intel', 'tech', 'software', 'ai',
        'artificial intelligence', 'machine learning'
    ],
    crypto: CRYPTO_KEYWORDS,
    economy: [
        'federal reserve', 'fed', 'inflation', 'gdp', 'unemployment',
        'interest rate', 'monetary policy', 'central bank'
    ],
    stocks: [
        'earnings', 'dividend', 'ipo', 'shares', 'stock price',
        'analyst rating', 'buy rating', 'sell rating'
    ],
    market: [
        'dow jones', 'nasdaq', 's&p 500', 'market', 'trading',
        'bull market', 'bear market', 'volatility'
    ]
};

// API rate limiting configuration
export const RATE_LIMITS = {
    newsApi: {
        requests: 100,
        period: 'day',
        burst: 10
    },
    finnhub: {
        requests: 60,
        period: 'minute',
        burst: 60
    },
    alphaVantage: {
        requests: 25,
        period: 'day',
        burst: 5
    }
};

// Error messages for different scenarios
export const ERROR_MESSAGES = {
    noApiKey: 'API key not configured. Using demo data.',
    rateLimited: 'API rate limit exceeded. Please try again later.',
    networkError: 'Network error occurred. Check your connection.',
    invalidResponse: 'Invalid response from news API.',
    noResults: 'No news articles found for your search.'
};
