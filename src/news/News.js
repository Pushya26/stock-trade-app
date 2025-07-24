// News.js
// LSE Financial News Component - Yahoo Finance Inspired Design

import React, { useState, useEffect, useCallback } from 'react';
import lseNewsService from './lseNewsService.js';
import lseCompanies from './lseCompaniesParser.js';
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import logo from "../assets/tradelogo.png";
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import { FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from '../components/ThemeProvider';
import './News.css';
import NewsSection from './NewsSection';

const News = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark, setIsDark } = useTheme();

    const [articles, setArticles] = useState([]);
    const [displayedArticlesCount, setDisplayedArticlesCount] = useState(6);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        searchTerm: '',
        category: 'all',
        priority: 'mixed'
    });
    const [marketMovingNews, setMarketMovingNews] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [cash, setCash] = useState(0);
    const [apiStatus, setApiStatus] = useState({
        newsData: 'checking',
        finnhub: 'checking',
        rss: 'checking'
    });
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(null);
    const [nextRefreshTime, setNextRefreshTime] = useState(null);
    const [showGeneratedNews, setShowGeneratedNews] = useState(false);
    const [symbolFilter, setSymbolFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchLogic, setSearchLogic] = useState('or');
    const [sortOrder, setSortOrder] = useState('date_desc');

    // Debug: Log article URLs when articles state changes
    useEffect(() => {
        if (articles.length > 0) {
            console.log('Loaded articles URLs:');
            articles.forEach((article, index) => {
                console.log(`Article ${index + 1}:`, article.url);
            });
        }
    }, [articles]);

    const isActive = (path) => location.pathname === path;

    // Theme-based styles
    const themeStyles = {
        background: isDark ? 'bg-slate-900' : 'bg-gray-50',
        headerBg: isDark ? 'bg-slate-800' : 'bg-white',
        headerBorder: isDark ? 'border-slate-700' : 'border-gray-200',
        text: isDark ? 'text-white' : 'text-gray-900',
        textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
        textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
        buttonPrimary: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600',
        buttonSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300',
        cardBg: isDark ? 'bg-slate-800' : 'bg-white',
    };

    // Fetch news from backend API with filters
    useEffect(() => {
        const fetchCachedNews = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = {
                    limit: displayedArticlesCount,
                    offset: 0
                };
                if (symbolFilter) params.symbol = symbolFilter;
                if (tagFilter) params.tag = tagFilter;
                if (categoryFilter) params.category = categoryFilter;
                if (searchTerm) params.search = searchTerm;
                if (searchTerm) params.search_logic = searchLogic;
                if (sortOrder) params.sort = sortOrder;
                const res = await axiosInstance.get("v1/trading/cached-news/", { params });
                setArticles(res.data.results);
                setLastUpdated(new Date());
            } catch (err) {
                setError("Failed to load news");
            } finally {
                setLoading(false);
            }
        };
        fetchCachedNews();
    }, [displayedArticlesCount, symbolFilter, tagFilter, categoryFilter, searchTerm, searchLogic, sortOrder]);

    // Load more handler
    const handleLoadMore = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosInstance.get("v1/trading/cached-news/", {
                params: { limit: 6, offset: articles.length }
            });
            setArticles(prev => [...prev, ...res.data.results]);
            setDisplayedArticlesCount(prev => prev + 6);
        } catch (err) {
            setError("Failed to load more news");
        } finally {
            setLoading(false);
        }
    };

    // Filter articles based on current filters
    useEffect(() => {
        // Filter out articles with missing or invalid URLs
        const validArticles = articles.filter(article => {
            return article.url && typeof article.url === 'string' && article.url.trim() !== '';
        });

        // The original lseNewsService.filterNews logic is removed as per the edit hint.
        // The articles state is now directly used for rendering and counts.
        setDisplayedArticlesCount(20); // Reset to initial count when filters change
    }, [articles, filters.searchTerm, filters.category]);

    // Initial data load
    useEffect(() => {
        const fetchPortfolioSummary = async () => {
            try {
                const res = await axiosInstance.get('/trade/portfolio_information/');
                setCash(parseFloat(res.data.cash));
            } catch (error) {
                console.error('Failed to fetch portfolio data:', error);
            }
        };
        fetchPortfolioSummary();
    }, []);

    // Auto-refresh functionality
    useEffect(() => {
        if (autoRefresh) {
            console.log('Setting up auto-refresh every 5 minutes');
            const interval = setInterval(() => {
                console.log('Auto-refreshing news...');
                setDisplayedArticlesCount((prev) => prev); // Triggers useEffect to refetch news
                setNextRefreshTime(Date.now() + 5 * 60 * 1000); // Set next refresh time
            }, 5 * 60 * 1000); // 5 minutes

            // Set initial next refresh time
            setNextRefreshTime(Date.now() + 5 * 60 * 1000);
            setRefreshInterval(interval);

            return () => {
                console.log('Clearing auto-refresh interval');
                clearInterval(interval);
                setNextRefreshTime(null);
            };
        } else if (refreshInterval) {
            clearInterval(refreshInterval);
            setRefreshInterval(null);
            setNextRefreshTime(null);
        }
    }, [autoRefresh]);

    // Manual refresh
    const handleRefresh = () => {
        setDisplayedArticlesCount((prev) => prev); // Triggers useEffect to refetch news
        if (autoRefresh) {
            setNextRefreshTime(Date.now() + 5 * 60 * 1000);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    // Filter handlers
    const handleSearchChange = (e) => {
        setFilters(prev => ({
            ...prev,
            searchTerm: e.target.value
        }));
    };

    const handleCategoryChange = (category) => {
        setFilters(prev => ({
            ...prev,
            category
        }));
    };

    // Handle filter/search submit
    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setDisplayedArticlesCount(6); // Reset pagination on new search
    };

    // Clear all filters
    const handleClearFilters = () => {
        setSymbolFilter('');
        setTagFilter('');
        setCategoryFilter('');
        setSearchTerm('');
        setSearchLogic('or');
        setSortOrder('date_desc');
        setDisplayedArticlesCount(6);
    };

    // Format time ago
    const formatTimeAgo = (timestamp) => {
        try {
            const now = Date.now();
            const time = new Date(timestamp).getTime();
            const diffMs = now - time;
            const diffHours = diffMs / (1000 * 60 * 60);
            const diffDays = diffHours / 24;

            if (diffHours < 1) {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                return `${diffMinutes}m ago`;
            } else if (diffHours < 24) {
                return `${Math.floor(diffHours)}h ago`;
            } else if (diffDays < 7) {
                return `${Math.floor(diffDays)}d ago`;
            } else {
                return new Date(timestamp).toLocaleDateString();
            }
        } catch {
            return 'Recently';
        }
    };

    // Get relevance badge
    const getRelevanceBadge = (score) => {
        if (score >= 5) return { text: 'High', className: 'high-relevance' };
        if (score >= 3) return { text: 'Medium', className: 'medium-relevance' };
        if (score >= 1) return { text: 'Low', className: 'low-relevance' };
        return { text: 'General', className: 'general-relevance' };
    };

    // Loading state
    if (loading) {
        return (
            <div className={`min-h-screen ${themeStyles.background} ${themeStyles.text} transition-colors duration-200`}>
                <header className={`${themeStyles.headerBg} border-b ${themeStyles.headerBorder} fixed top-0 w-full z-50 transition-colors duration-200`}>
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <img src={logo} alt="Logo" className="w-8 h-8" />
                                <span className="text-xl font-semibold">EducateTrade</span>
                            </div>
                            <nav className="flex items-center space-x-16 text-xl">
                                <button onClick={() => navigate('/portfolio')} className="font-semibold text-blue-500">Dashboard</button>
                                <button onClick={() => navigate('/trade')} className="font-semibold text-blue-500">Trade</button>
                                <button onClick={() => navigate('/research')} className="font-semibold text-blue-500">Research</button>
                                <button onClick={() => navigate('/news')} className={`font-semibold ${themeStyles.text}`}>News</button>
                                <button onClick={() => navigate('/orders')} className="font-semibold text-blue-500">Orders</button>
                            </nav>
                            <div className="flex items-center space-x-4">
                                <button onClick={() => setIsDark(prev => !prev)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900">
                                    {isDark ? <FaMoon /> : <FaSun />}
                                </button>
                                <div className={`${themeStyles.buttonPrimary} text-white px-4 py-2 rounded-lg font-semibold`}>
                                    £{cash.toFixed(2)}
                                </div>
                                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
                                    LOGOUT
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="min-h-screen max-w-7xl mx-auto px-6 pt-[120px]">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-xl mb-2">Loading Near-Live Global Market News</p>
                            <div className="text-sm space-y-1">
                                <p>• Fetching from Yahoo Finance RSS feeds (Headlines, Markets, Stocks)</p>
                                <p>• Retrieving global market news from Yahoo Finance, CNBC</p>
                                <p>• Processing {lseCompanies.getAllCompanies().length.toLocaleString()} LSE companies</p>
                                <p>• Aggregating UK and international financial news feeds</p>
                                <p>• Applying smart filtering for LSE relevance</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`min-h-screen ${themeStyles.background} ${themeStyles.text} transition-colors duration-200`}>
                <header className={`${themeStyles.headerBg} border-b ${themeStyles.headerBorder} fixed top-0 w-full z-50 transition-colors duration-200`}>
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <img src={logo} alt="Logo" className="w-8 h-8" />
                                <span className="text-xl font-semibold">EducateTrade</span>
                            </div>
                            <nav className="flex items-center space-x-16 text-xl">
                                <button onClick={() => navigate('/portfolio')} className="font-semibold text-blue-500">Dashboard</button>
                                <button onClick={() => navigate('/trade')} className="font-semibold text-blue-500">Trade</button>
                                <button onClick={() => navigate('/research')} className="font-semibold text-blue-500">Research</button>
                                <button onClick={() => navigate('/news')} className={`font-semibold ${themeStyles.text}`}>News</button>
                                <button onClick={() => navigate('/orders')} className="font-semibold text-blue-500">Orders</button>
                            </nav>
                            <div className="flex items-center space-x-4">
                                <button onClick={() => setIsDark(prev => !prev)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900">
                                    {isDark ? <FaMoon /> : <FaSun />}
                                </button>
                                <div className={`${themeStyles.buttonPrimary} text-white px-4 py-2 rounded-lg font-semibold`}>
                                    £{cash.toFixed(2)}
                                </div>
                                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
                                    LOGOUT
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="min-h-screen max-w-7xl mx-auto px-6 pt-[120px]">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="text-6xl mb-4">⚠</div>
                            <h3 className="text-xl font-semibold mb-2">Unable to Load News</h3>
                            <p className="mb-4">{error}</p>
                            <button onClick={handleRefresh} className={`${themeStyles.buttonPrimary} text-white px-6 py-2 rounded-lg`}>
                                Try Again
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${themeStyles.background} ${themeStyles.text} transition-colors duration-200`}>
            {/* Header */}
            <header className={`${themeStyles.headerBg} border-b ${themeStyles.headerBorder} fixed top-0 w-full z-50 transition-colors duration-200`}>
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <img src={logo} alt="Logo" className="w-8 h-8" />
                            <span className="text-xl font-semibold">EducateTrade</span>
                        </div>
                        <nav className="flex items-center space-x-16 text-xl">
                            <button
                                onClick={() => navigate('/portfolio')}
                                className={`font-semibold transition-colors duration-200 ${isActive('/portfolio')
                                    ? themeStyles.text
                                    : `text-blue-500 hover:text-blue-400`
                                    }`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => navigate('/trade')}
                                className={`font-semibold transition-colors duration-200 ${isActive('/trade')
                                    ? themeStyles.text
                                    : `text-blue-500 hover:text-blue-400`
                                    }`}
                            >
                                Trade
                            </button>
                            <button
                                onClick={() => navigate('/research')}
                                className={`font-semibold transition-colors duration-200 ${isActive('/research')
                                    ? themeStyles.text
                                    : `text-blue-500 hover:text-blue-400`
                                    }`}
                            >
                                Research
                            </button>
                            <button
                                onClick={() => navigate('/news')}
                                className={`font-semibold transition-colors duration-200 ${isActive('/news')
                                    ? themeStyles.text
                                    : `text-blue-500 hover:text-blue-400`
                                    }`}
                            >
                                News
                            </button>
                            <button
                                onClick={() => navigate('/orders')}
                                className={`font-semibold transition-colors duration-200 ${isActive('/orders')
                                    ? themeStyles.text
                                    : `text-blue-500 hover:text-blue-400`
                                    }`}
                            >
                                Orders
                            </button>
                        </nav>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setIsDark(prev => !prev)}
                                className={`px-4 py-2 rounded-lg ${themeStyles.buttonSecondary} transition-colors`}
                            >
                                {isDark ? <FaMoon className="text-gray-300" /> : <FaSun className="text-black" />}
                            </button>
                            <div className={`${themeStyles.buttonPrimary} text-white px-4 py-2 rounded-lg font-semibold`}>
                                £{cash.toFixed(2)}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                            >
                                LOGOUT
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="min-h-screen max-w-7xl mx-auto px-6 pt-[120px]">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">Global Market News</h1>
                                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                    Live Feed
                                </span>
                            </div>
                            <p className={`${themeStyles.textSecondary} text-lg`}>
                                Near-live global market news with LSE focus from Yahoo Finance and major news sources
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <input
                                type="text"
                                placeholder="Search news articles..."
                                value={filters.searchTerm}
                                onChange={handleSearchChange}
                                className={`px-4 py-2 border rounded-lg ${themeStyles.cardBg} ${themeStyles.text} ${themeStyles.headerBorder} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64`}
                            />
                            <div className="flex items-center space-x-2">
                                <label className="flex items-center space-x-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={autoRefresh}
                                        onChange={(e) => setAutoRefresh(e.target.checked)}
                                        className="rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className={themeStyles.textSecondary}>Auto-refresh (5min)</span>
                                </label>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className={`${themeStyles.buttonPrimary} text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2`}
                                disabled={loading}
                            >
                                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* API Status */}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                        <span className={themeStyles.textSecondary}>News Aggregators:</span>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${apiStatus.newsData === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                            Yahoo Finance Live {apiStatus.newsData === 'active' ? '✓' : '⚠'}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${apiStatus.finnhub === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                            Global Markets {apiStatus.finnhub === 'active' ? '✓' : '⚠'}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${apiStatus.rss === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                            Yahoo Finance/CNBC {apiStatus.rss === 'active' ? '✓' : '⚠'}
                        </span>
                        {(apiStatus.newsData === 'limited' && apiStatus.finnhub === 'limited' && apiStatus.rss === 'limited') && (
                            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                📰 Showing curated global market news with LSE focus
                            </span>
                        )}
                        {autoRefresh && (
                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                🔄 Auto-refreshing every 5 minutes
                                {nextRefreshTime && (
                                    <span className="ml-1 opacity-75">
                                        (next: {new Date(nextRefreshTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                    </span>
                                )}
                            </span>
                        )}
                        {lastUpdated && (
                            <span className={`${themeStyles.textMuted} ml-auto`}>
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-4 mb-6">
                        <select
                            value={filters.category}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className={`px-3 py-2 border rounded-lg ${themeStyles.cardBg} ${themeStyles.text} ${themeStyles.headerBorder}`}
                        >
                            <option value="all">All Categories</option>
                            <option value="lse">LSE Specific</option>
                            <option value="market">Market General</option>
                        </select>
                        <span className={`${themeStyles.textMuted} text-sm`}>
                            {articles.length} articles found
                        </span>
                    </div>
                </div>
                {/* Main Content Grid and rest of the JSX ... */}
                <NewsSection />
            </main>
        </div>
    );
};

export default News;