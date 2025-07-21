// NewsSettings.js
import React, { useState, useEffect } from 'react';
import { FiSettings, FiInfo, FiExternalLink } from 'react-icons/fi';
import { useTheme } from '../components/ThemeProvider';
import { NEWS_API_ENDPOINTS } from './newsApiConfig';

const NewsSettings = ({ isOpen, onClose, onRefresh }) => {
    const { isDark } = useTheme();
    const [settings, setSettings] = useState({
        maxArticles: 50,
        preferredSources: []
    });

    // Theme-based styles
    const themeStyles = {
        background: isDark ? 'bg-slate-900' : 'bg-gray-50',
        cardBg: isDark ? 'bg-slate-800' : 'bg-white',
        cardBorder: isDark ? 'border-slate-700' : 'border-gray-200',
        text: isDark ? 'text-white' : 'text-gray-900',
        textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
        textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
        buttonPrimary: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600',
        buttonSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300',
        inputBg: isDark ? 'bg-slate-700' : 'bg-white',
        inputBorder: isDark ? 'border-slate-600' : 'border-gray-300',
    };

    useEffect(() => {
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('newsSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const saveSettings = () => {
        localStorage.setItem('newsSettings', JSON.stringify(settings));
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${themeStyles.cardBg} rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto`}>
                {/* Header */}
                <div className={`p-6 border-b ${themeStyles.cardBorder}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FiSettings className={`w-6 h-6 ${themeStyles.text}`} />
                            <h2 className={`text-2xl font-bold ${themeStyles.text}`}>News Settings</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className={`${themeStyles.buttonSecondary} p-2 rounded-lg transition-colors duration-200`}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* API Configuration Status */}
                    <div className={`${themeStyles.cardBg} border ${themeStyles.cardBorder} rounded-lg p-4`}>
                        <h3 className={`text-lg font-semibold mb-4 ${themeStyles.text}`}>API Configuration</h3>
                        <div className="space-y-3">
                            {Object.entries(NEWS_API_ENDPOINTS).map(([key, endpoint]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <div>
                                        <span className={`font-medium ${themeStyles.text}`}>{endpoint.name}</span>
                                        <p className={`text-sm ${themeStyles.textMuted}`}>{endpoint.description}</p>
                                        <p className={`text-xs ${themeStyles.textMuted}`}>
                                            Free Limit: {endpoint.freeLimit}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {endpoint.keyRequired ? (
                                            <span className="text-red-500 text-sm">Not Configured</span>
                                        ) : (
                                            <span className="text-green-500 text-sm">Available</span>
                                        )}
                                        {endpoint.signupUrl && (
                                            <a
                                                href={endpoint.signupUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`${themeStyles.buttonPrimary} text-white px-3 py-1 rounded text-sm flex items-center gap-1`}
                                            >
                                                Get Key
                                                <FiExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Max Articles */}
                    <div>
                        <h3 className={`text-lg font-semibold mb-3 ${themeStyles.text}`}>Maximum Articles</h3>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            step="10"
                            value={settings.maxArticles}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                maxArticles: parseInt(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                            <span>10</span>
                            <span>{settings.maxArticles} articles</span>
                            <span>100</span>
                        </div>
                    </div>

                    {/* Information Box */}
                    <div className={`bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4`}>
                        <div className="flex items-start gap-3">
                            <FiInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                    Getting API Keys
                                </h4>
                                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                                    To access real-time news data, sign up for free API keys from the providers above.
                                    Add them to your .env file:
                                </p>
                                <code className="text-xs bg-blue-100 dark:bg-blue-800 p-2 rounded block">
                                    REACT_APP_NEWS_API_KEY=your_key_here<br />
                                    REACT_APP_FINNHUB_KEY=your_key_here<br />
                                    REACT_APP_ALPHA_VANTAGE_KEY=your_key_here
                                </code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-6 border-t ${themeStyles.cardBorder} flex justify-between`}>
                    <button
                        onClick={onRefresh}
                        className={`${themeStyles.buttonSecondary} ${themeStyles.text} px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200`}
                    >
                        <FiSettings className="w-4 h-4" />
                        Refresh Now
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className={`${themeStyles.buttonSecondary} ${themeStyles.text} px-4 py-2 rounded-lg transition-colors duration-200`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={saveSettings}
                            className={`${themeStyles.buttonPrimary} text-white px-4 py-2 rounded-lg transition-colors duration-200`}
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsSettings;
