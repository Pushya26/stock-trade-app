// rssFeedParser.js
// Fallback RSS feed parser for free news sources

export class RSSFeedParser {
    // Parse RSS feed from various financial news sources
    static async parseRSSFeed(url) {
        try {
            // Use a CORS proxy for RSS feeds
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const response = await fetch(proxyUrl + encodeURIComponent(url));
            const data = await response.json();

            if (data.contents) {
                return this.parseXMLContent(data.contents, url);
            }
            return [];
        } catch (error) {
            console.error('RSS parsing error:', error);
            return [];
        }
    }

    // Parse XML content from RSS feeds
    static parseXMLContent(xmlString, sourceUrl) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            const items = xmlDoc.querySelectorAll('item');

            const articles = [];
            items.forEach((item, index) => {
                if (index < 10) { // Limit to 10 articles per feed
                    const article = this.extractArticleData(item, sourceUrl);
                    if (article) {
                        articles.push(article);
                    }
                }
            });

            return articles;
        } catch (error) {
            console.error('XML parsing error:', error);
            return [];
        }
    }

    // Extract article data from RSS item
    static extractArticleData(item, sourceUrl) {
        try {
            const title = this.getTextContent(item, 'title');
            const description = this.getTextContent(item, 'description');
            const link = this.getTextContent(item, 'link');
            const pubDate = this.getTextContent(item, 'pubDate');
            const category = this.getTextContent(item, 'category');

            if (!title || !link) return null;

            return {
                id: `rss_${Date.now()}_${Math.random()}`,
                title: this.cleanText(title),
                summary: this.cleanText(description) || title.substring(0, 200) + '...',
                category: this.categorizeFromRSS(title + ' ' + description + ' ' + category),
                author: this.extractSource(sourceUrl),
                publishedAt: this.parseDate(pubDate),
                url: link,
                imageUrl: this.extractImage(item) || this.getPlaceholderImage(),
                source: this.extractSource(sourceUrl),
                content: this.cleanText(description)
            };
        } catch (error) {
            console.error('Article extraction error:', error);
            return null;
        }
    }

    // Helper function to get text content
    static getTextContent(item, tagName) {
        const element = item.querySelector(tagName);
        return element ? element.textContent.trim() : '';
    }

    // Clean HTML and extra whitespace from text
    static cleanText(text) {
        if (!text) return '';

        // Remove HTML tags
        const cleanedText = text.replace(/<[^>]*>/g, '');

        // Replace common HTML entities
        const entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' '
        };

        let result = cleanedText;
        Object.keys(entities).forEach(entity => {
            result = result.replace(new RegExp(entity, 'g'), entities[entity]);
        });

        // Clean up extra whitespace
        return result.replace(/\s+/g, ' ').trim();
    }

    // Parse publication date
    static parseDate(dateString) {
        if (!dateString) return new Date().toISOString();

        try {
            const date = new Date(dateString);
            return date.toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
    }

    // Extract source name from URL
    static extractSource(url) {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('feeds.', '').replace('www.', '');
        } catch (error) {
            return 'Unknown Source';
        }
    }

    // Extract image from RSS item
    static extractImage(item) {
        // Try different image tags
        const imageTags = ['media:content', 'enclosure', 'image'];

        for (const tag of imageTags) {
            const element = item.querySelector(tag);
            if (element) {
                const url = element.getAttribute('url') || element.getAttribute('src');
                if (url && url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    return url;
                }
            }
        }

        // Try to extract from description
        const description = this.getTextContent(item, 'description');
        const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i);
        if (imgMatch) {
            return imgMatch[1];
        }

        return null;
    }

    // Get placeholder image
    static getPlaceholderImage() {
        return 'https://via.placeholder.com/400x200/6b7280/white?text=Financial+News';
    }

    // Categorize article based on content
    static categorizeFromRSS(text) {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('crypto') || lowerText.includes('bitcoin')) {
            return 'crypto';
        }
        if (lowerText.includes('tech') || lowerText.includes('apple') || lowerText.includes('microsoft')) {
            return 'technology';
        }
        if (lowerText.includes('federal reserve') || lowerText.includes('inflation')) {
            return 'economy';
        }
        if (lowerText.includes('earnings') || lowerText.includes('stock')) {
            return 'stocks';
        }
        return 'market';
    }
}

// Free RSS feed sources (no API key required)
export const FREE_RSS_FEEDS = [
    // LSE and UK-specific sources
    {
        name: 'Financial Times UK',
        url: 'https://www.ft.com/rss/home/uk',
        category: 'lse'
    },
    {
        name: 'BBC Business',
        url: 'http://feeds.bbci.co.uk/news/business/rss.xml',
        category: 'lse'
    },
    {
        name: 'Guardian Business',
        url: 'https://www.theguardian.com/uk/business/rss',
        category: 'lse'
    },
    {
        name: 'Telegraph Business',
        url: 'https://www.telegraph.co.uk/business/rss.xml',
        category: 'lse'
    },
    {
        name: 'This is Money',
        url: 'https://www.thisismoney.co.uk/money/news/index.rss',
        category: 'lse'
    },
    // General financial sources
    {
        name: 'Yahoo Finance',
        url: 'https://feeds.finance.yahoo.com/rss/2.0/headline',
        category: 'market'
    },
    {
        name: 'MarketWatch',
        url: 'https://feeds.marketwatch.com/marketwatch/topstories/',
        category: 'market'
    },
    {
        name: 'Reuters Business',
        url: 'https://feeds.reuters.com/reuters/businessNews',
        category: 'market'
    },
    {
        name: 'CNBC Top News',
        url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
        category: 'market'
    },
    {
        name: 'Bloomberg Markets',
        url: 'https://feeds.bloomberg.com/markets/news.rss',
        category: 'market'
    }
];

// Fetch news from free RSS sources
export const fetchFreeNews = async () => {
    try {
        const feedPromises = FREE_RSS_FEEDS.map(feed =>
            RSSFeedParser.parseRSSFeed(feed.url)
                .then(articles => articles.map(article => ({
                    ...article,
                    category: feed.category
                })))
                .catch(error => {
                    console.warn(`Failed to fetch ${feed.name}:`, error);
                    return [];
                })
        );

        const results = await Promise.all(feedPromises);
        const allArticles = results.flat();

        // Remove duplicates and sort by date
        const uniqueArticles = removeDuplicates(allArticles);
        return uniqueArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } catch (error) {
        console.error('Error fetching free news:', error);
        return [];
    }
};

// Fetch LSE-specific news from RSS sources
export const fetchLSERSSNews = async () => {
    try {
        const lseFeeds = FREE_RSS_FEEDS.filter(feed => feed.category === 'lse');

        const feedPromises = lseFeeds.map(feed =>
            RSSFeedParser.parseRSSFeed(feed.url)
                .then(articles => articles.map(article => ({
                    ...article,
                    category: feed.category,
                    source: feed.name
                })))
                .catch(error => {
                    console.warn(`Failed to fetch ${feed.name}:`, error);
                    return [];
                })
        );

        const results = await Promise.all(feedPromises);
        const allArticles = results.flat();

        // Sort by publish date (newest first)
        allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        console.log(`Fetched ${allArticles.length} LSE articles from RSS feeds`);
        return allArticles.slice(0, 20); // Return top 20 articles

    } catch (error) {
        console.error('Error fetching LSE RSS news:', error);
        return [];
    }
};

// Remove duplicate articles
const removeDuplicates = (articles) => {
    const seen = new Set();
    return articles.filter(article => {
        const key = article.title.toLowerCase().substring(0, 50);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};
