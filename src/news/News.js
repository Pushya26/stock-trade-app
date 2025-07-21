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

const News = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark, setIsDark } = useTheme();

    const [articles, setArticles] = useState([]);
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [displayedArticlesCount, setDisplayedArticlesCount] = useState(20);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        searchTerm: '',
        category: 'all',
        priority: 'mixed'
    });
    const [breakingNews, setBreakingNews] = useState([]);
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

    // Load all LSE news
    const loadNews = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
                            console.log('Loading LSE news with priority:', filters.priority);

            const [
                newsArticles,
                breakingArticles,
                marketArticles
            ] = await Promise.all([
                lseNewsService.fetchLSENews({
                    maxArticles: 150,
                    priority: filters.priority,
                    freshOnly: true
                }),
                lseNewsService.getBreakingNews(10),
                lseNewsService.getMarketMovingNews(15)
            ]);

            setArticles(newsArticles);
            setBreakingNews(breakingArticles);
            setMarketMovingNews(marketArticles);
            setLastUpdated(new Date());
            
            // Update API status based on actual article source info            
            // Check for actual RSS/API data vs curated content
            const hasYahooRSS = newsArticles.some(a => a.apiSource?.includes('Yahoo Finance RSS') || a.source?.includes('Yahoo Finance RSS'));
            const hasGuardianRSS = newsArticles.some(a => a.apiSource?.includes('Guardian Business RSS') || a.source?.includes('Guardian RSS'));
            const hasBBCRSS = newsArticles.some(a => a.apiSource?.includes('BBC Business RSS'));
            
            setApiStatus({
                newsData: hasYahooRSS ? 'active' : 
                         newsArticles.some(a => a.source?.includes('Yahoo Finance') || a.apiSource?.includes('Yahoo Finance')) ? 'limited' : 'limited',
                finnhub: hasBBCRSS ? 'active' :
                        newsArticles.some(a => a.source?.includes('BBC Business') || a.apiSource?.includes('BBC Business')) ? 'limited' : 'limited',
                rss: hasGuardianRSS ? 'active' : 
                     newsArticles.some(a => a.source?.includes('Guardian') || a.apiSource?.includes('Guardian Business')) ? 'limited' : 'limited'
            });

            console.log(`Loaded ${newsArticles.length} news articles from financial sources`);
            console.log(`RSS Data - Yahoo: ${hasYahooRSS}, BBC: ${hasBBCRSS}, Guardian: ${hasGuardianRSS}`);

            } catch (err) {
            console.error('Error loading news:', err);
            setError('Failed to load news from RSS feeds. Please check your internet connection or try again later.');
            setApiStatus({
                newsData: 'error',
                finnhub: 'error',
                rss: 'error'
            });
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, [filters.priority]);

    // Filter articles based on current filters
    useEffect(() => {
        const filtered = lseNewsService.filterNews(articles, {
            searchTerm: filters.searchTerm,
            category: filters.category
        });
        setFilteredArticles(filtered);
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
        loadNews();
    }, [loadNews]);

    // Auto-refresh functionality
    useEffect(() => {
        if (autoRefresh) {
            console.log('Setting up auto-refresh every 5 minutes');
            const interval = setInterval(() => {
                console.log('Auto-refreshing news...');
                loadNews(false); // Don't show loading spinner for auto-refresh
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
    }, [autoRefresh, loadNews, refreshInterval]);

    // Manual refresh
    const handleRefresh = () => {
        loadNews();
        // Reset the auto-refresh timer
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

    const handlePriorityChange = (priority) => {
        setFilters(prev => ({
            ...prev,
            priority
        }));
        // Reload with new priority
        setTimeout(() => loadNews(), 100);
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
                            <p className="text-xl mb-2">Loading LSE Financial News</p>
                            <div className="text-sm space-y-1">
                                <p>• Fetching from Yahoo Finance RSS feed</p>
                                <p>• Retrieving BBC Business news</p>
                                <p>• Processing {lseCompanies.getAllCompanies().length.toLocaleString()} LSE companies</p>
                                <p>• Aggregating UK financial news feeds</p>
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
                                <h1 className="text-3xl font-bold">LSE Financial News</h1>
                                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                    {lseCompanies.getAllCompanies().length.toLocaleString()} Companies
                                </span>
                            </div>
                            <p className={`${themeStyles.textSecondary} text-lg`}>
                                Real-time news for London Stock Exchange companies
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
                        <span className={themeStyles.textSecondary}>RSS Aggregators:</span>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${apiStatus.newsData === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                            Yahoo Finance {apiStatus.newsData === 'active' ? '✓' : '⚠'}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${apiStatus.finnhub === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                            BBC Business {apiStatus.finnhub === 'active' ? '✓' : '⚠'}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${apiStatus.rss === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                            UK News Feeds {apiStatus.rss === 'active' ? '✓' : '⚠'}
                        </span>
                        {(apiStatus.newsData === 'limited' && apiStatus.finnhub === 'limited' && apiStatus.rss === 'limited') && (
                            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                📰 Showing curated LSE news
                            </span>
                        )}
                        {autoRefresh && (
                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                🔄 Auto-refreshing every 5 minutes
                                {nextRefreshTime && (
                                    <span className="ml-1 opacity-75">
                                        (next: {new Date(nextRefreshTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
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
                        <select 
                            value={filters.priority} 
                            onChange={(e) => handlePriorityChange(e.target.value)}
                            className={`px-3 py-2 border rounded-lg ${themeStyles.cardBg} ${themeStyles.text} ${themeStyles.headerBorder}`}
                        >
                            <option value="mixed">Mixed Companies</option>
                            <option value="major">Major Companies Only</option>
                            <option value="all">All Companies</option>
                        </select>
                        <span className={`${themeStyles.textMuted} text-sm`}>
                            {filteredArticles.length} articles found
                        </span>
                    </div>
                </div>

                {/* Breaking News */}
                {breakingNews.length > 0 && (
                    <div className={`${themeStyles.cardBg} rounded-lg border ${themeStyles.headerBorder} p-4 mb-6`}>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">BREAKING</span>
                            <span className={themeStyles.textSecondary}>{breakingNews.length} latest</span>
                        </div>
                        <div className="space-y-2">
                            {breakingNews.map((article) => (
                                <div key={article.id} className="flex items-start justify-between">
                                    <a 
                                        href={article.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex-1"
                                    >
                                        {article.title}
                                    </a>
                                    <span className={`${themeStyles.textMuted} text-sm whitespace-nowrap ml-4`}>
                                        {formatTimeAgo(article.publishedAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Articles */}
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-semibold mb-4">
                            All LSE News (Showing {Math.min(displayedArticlesCount, filteredArticles.length)} of {filteredArticles.length})
                        </h2>
                        <div className={`${themeStyles.cardBg} rounded-lg border ${themeStyles.headerBorder} overflow-hidden`}>
                            {filteredArticles.length === 0 ? (
                                <div className="p-8 text-center">
                                    <FiSearch className={`w-12 h-12 ${themeStyles.textMuted} mx-auto mb-4`} />
                                    <h3 className="font-semibold mb-2">No articles found</h3>
                                    <p className={themeStyles.textSecondary}>Try adjusting your search terms or filters</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredArticles.slice(0, displayedArticlesCount).map((article) => (
                                        <div key={article.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors">
                                            <h3 className="font-semibold mb-2">
                                                <a 
                                                    href={article.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    {article.title}
                                                </a>
                                            </h3>
                                            {article.summary && (
                                                <p className={`${themeStyles.textSecondary} mb-3 line-clamp-3`}>
                                                    {article.summary}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-4">
                                                    <span className={themeStyles.textMuted}>{article.source}</span>
                                                    <span className={themeStyles.textMuted}>{formatTimeAgo(article.publishedAt)}</span>
                                                    <span className={`px-2 py-1 rounded text-xs ${themeStyles.buttonSecondary}`}>
                                                        {article.apiSource}
                                                    </span>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    getRelevanceBadge(article.relevanceScore).text === 'High' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                    getRelevanceBadge(article.relevanceScore).text === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                    {getRelevanceBadge(article.relevanceScore).text}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Load More Button */}
                                    {filteredArticles.length > displayedArticlesCount && (
                                        <div className="p-6 text-center border-t border-gray-200 dark:border-gray-700">
                                            <button
                                                onClick={() => setDisplayedArticlesCount(prev => prev + 20)}
                                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                            >
                                                Load More Articles ({filteredArticles.length - displayedArticlesCount} remaining)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Market Moving News */}
                        {marketMovingNews.length > 0 && (
                            <div className={`${themeStyles.cardBg} rounded-lg border ${themeStyles.headerBorder} p-4`}>
                                <h3 className="font-semibold mb-4">Market Moving News</h3>
                                <div className="space-y-4">
                                    {marketMovingNews.map((article) => (
                                        <div key={article.id}>
                                            <h4 className="text-sm font-medium mb-1">
                                                <a 
                                                    href={article.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                >
                                                    {article.title}
                                                </a>
                                            </h4>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={themeStyles.textMuted}>{article.source}</span>
                                                <span className={themeStyles.textMuted}>{formatTimeAgo(article.publishedAt)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Statistics */}
                        <div className={`${themeStyles.cardBg} rounded-lg border ${themeStyles.headerBorder} p-4`}>
                            <h4 className="font-semibold mb-4">LSE Companies Tracked</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className={themeStyles.textSecondary}>Total Companies</span>
                                    <span className="font-semibold">{lseCompanies.getAllCompanies().length.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeStyles.textSecondary}>Major Companies</span>
                                    <span className="font-semibold">{lseCompanies.getMajorCompanies().length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeStyles.textSecondary}>Articles Today</span>
                                    <span className="font-semibold">{filteredArticles.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default News;
