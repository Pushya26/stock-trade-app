// LiveNewsMonitor.js
// Real-time news monitoring component with live updates

import React, { useState, useEffect, useRef } from 'react';
import { FiActivity, FiTrendingUp, FiAlertCircle, FiClock } from 'react-icons/fi';
import { useTheme } from '../components/ThemeProvider';
import NewsService from './newsService';

const LiveNewsMonitor = ({ isVisible = false, onClose }) => {
    const { isDark } = useTheme();
    const [breakingNews, setBreakingNews] = useState([]);
    const [marketMovingNews, setMarketMovingNews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const intervalRef = useRef(null);

    // Theme styles
    const themeStyles = {
        background: isDark ? 'bg-slate-800' : 'bg-white',
        border: isDark ? 'border-slate-600' : 'border-gray-300',
        text: isDark ? 'text-white' : 'text-gray-900',
        textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
        textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
        cardBg: isDark ? 'bg-slate-700' : 'bg-gray-50',
        buttonPrimary: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600',
    };

    useEffect(() => {
        if (isVisible) {
            fetchLiveUpdates();
            // Set up real-time updates every 2 minutes
            intervalRef.current = setInterval(fetchLiveUpdates, 120000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isVisible]);

    const fetchLiveUpdates = async () => {
        setIsLoading(true);
        try {
            const [breaking, marketMoving] = await Promise.all([
                NewsService.getLSEBreakingNews ? NewsService.getLSEBreakingNews(3) : NewsService.getBreakingNews(3),
                NewsService.getLSEMarketMovingNews ? NewsService.getLSEMarketMovingNews(5) : NewsService.getMarketMovingNews(5)
            ]);

            setBreakingNews(breaking);
            setMarketMovingNews(marketMoving.slice(0, 5));
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching live updates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const published = new Date(dateString);
        const diffInMinutes = Math.floor((now - published) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${themeStyles.background} border ${themeStyles.border} rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden shadow-2xl`}>
                {/* Header */}
                <div className={`p-4 border-b ${themeStyles.border} flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                        <FiActivity className={`w-6 h-6 ${isLoading ? 'animate-pulse text-red-500' : 'text-green-500'}`} />
                        <div>
                            <h3 className={`text-lg font-semibold ${themeStyles.text}`}>
                                Live News Monitor
                            </h3>
                            {lastUpdate && (
                                <p className={`text-sm ${themeStyles.textMuted}`}>
                                    Last updated: {lastUpdate.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`${themeStyles.textMuted} hover:${themeStyles.text} text-xl`}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    {/* Breaking News Section */}
                    {breakingNews.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <FiAlertCircle className="w-5 h-5 text-red-500" />
                                <h4 className={`font-semibold ${themeStyles.text}`}>Breaking News</h4>
                            </div>
                            <div className="space-y-3">
                                {breakingNews.map((article) => (
                                    <div
                                        key={article.id}
                                        className={`${themeStyles.cardBg} p-3 rounded-lg border-l-4 border-red-500`}
                                    >
                                        <h5 className={`font-medium ${themeStyles.text} mb-1 line-clamp-2`}>
                                            {article.title}
                                        </h5>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className={themeStyles.textSecondary}>{article.source}</span>
                                            <span className={`${themeStyles.textMuted} flex items-center gap-1`}>
                                                <FiClock className="w-3 h-3" />
                                                {formatTimeAgo(article.publishedAt)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Market Moving News Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <FiTrendingUp className="w-5 h-5 text-blue-500" />
                            <h4 className={`font-semibold ${themeStyles.text}`}>Market Moving News</h4>
                        </div>
                        <div className="space-y-3">
                            {marketMovingNews.length > 0 ? (
                                marketMovingNews.map((article) => (
                                    <div
                                        key={article.id}
                                        className={`${themeStyles.cardBg} p-3 rounded-lg border-l-4 border-blue-500`}
                                    >
                                        <h5 className={`font-medium ${themeStyles.text} mb-1 line-clamp-2`}>
                                            {article.title}
                                        </h5>
                                        <p className={`text-sm ${themeStyles.textSecondary} mb-2 line-clamp-1`}>
                                            {article.summary}
                                        </p>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${article.category === 'economy' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                article.category === 'stocks' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                    article.category === 'crypto' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                }`}>
                                                {article.category}
                                            </span>
                                            <span className={`${themeStyles.textMuted} flex items-center gap-1`}>
                                                <FiClock className="w-3 h-3" />
                                                {formatTimeAgo(article.publishedAt)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className={`${themeStyles.textMuted} text-center py-4`}>
                                    No recent market-moving news
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-4 border-t ${themeStyles.border} flex justify-between items-center`}>
                    <div className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                        <span className={themeStyles.textMuted}>
                            {isLoading ? 'Updating...' : 'Live monitoring active'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchLiveUpdates}
                            disabled={isLoading}
                            className={`${themeStyles.buttonPrimary} text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200 disabled:opacity-50`}
                        >
                            {isLoading ? 'Updating...' : 'Refresh'}
                        </button>
                        <button
                            onClick={onClose}
                            className={`bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200`}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveNewsMonitor;
