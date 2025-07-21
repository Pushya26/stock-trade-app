// NewsCard.js
import React from 'react';
import { FiExternalLink, FiClock, FiTag } from 'react-icons/fi';
import { useTheme } from '../components/ThemeProvider';

const NewsCard = ({ article, isLast = false }) => {
    const { isDark } = useTheme();

    // Theme-based styles
    const themeStyles = {
        text: isDark ? 'text-white' : 'text-gray-900',
        textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
        textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
        hoverBg: isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50',
        linkColor: isDark ? 'text-blue-400' : 'text-blue-600',
        borderColor: isDark ? 'border-slate-600' : 'border-gray-300',
    };

    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));

            if (diffInMinutes < 60) {
                return `${diffInMinutes}m ago`;
            } else if (diffInHours < 24) {
                return `${diffInHours}h ago`;
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            return 'Recent';
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            lse: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            market: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            stocks: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            economy: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
            technology: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
            crypto: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        };
        return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    };

    const handleClick = () => {
        if (article.url) {
            window.open(article.url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div
            className={`py-4 px-6 ${themeStyles.hoverBg} transition-colors duration-200 cursor-pointer ${!isLast ? `border-b ${themeStyles.borderColor}` : ''}`}
            onClick={handleClick}
        >
            <div className="flex items-start justify-between gap-4">
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className={`${themeStyles.linkColor} font-semibold text-lg leading-tight mb-2 hover:underline`}>
                        {article.title}
                    </h3>

                    {/* Summary */}
                    {(article.summary || article.description) && (
                        <p className={`${themeStyles.textSecondary} text-sm leading-relaxed mb-3 line-clamp-2`}>
                            {article.summary || article.description}
                        </p>
                    )}

                    {/* Meta Information */}
                    <div className="flex items-center gap-4 text-xs flex-wrap">
                        {/* Source */}
                        <span className={`${themeStyles.textMuted} font-medium`}>
                            {article.source || 'Unknown Source'}
                        </span>

                        {/* Time */}
                        <div className={`flex items-center gap-1 ${themeStyles.textMuted}`}>
                            <FiClock className="w-3 h-3" />
                            <span>{formatTime(article.publishedAt)}</span>
                        </div>

                        {/* Category */}
                        {article.category && (
                            <div className="flex items-center gap-1">
                                <FiTag className="w-3 h-3" />
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                                    {article.category.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* External Link Icon */}
                <div className={`${themeStyles.textMuted} hover:${themeStyles.linkColor} transition-colors duration-200 ml-2 flex-shrink-0`}>
                    <FiExternalLink className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
};

export default NewsCard;
