// NewsFilters.js
import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { useTheme } from '../components/ThemeProvider';

const NewsFilters = ({
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories
}) => {
    const { isDark } = useTheme();

    // Theme-based styles
    const themeStyles = {
        inputBg: isDark ? 'bg-slate-800' : 'bg-white',
        inputBorder: isDark ? 'border-slate-600' : 'border-gray-300',
        text: isDark ? 'text-white' : 'text-gray-900',
        textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
        buttonSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300',
        buttonActive: isDark ? 'bg-blue-600' : 'bg-blue-500',
    };

    return (
        <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
                <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${themeStyles.textMuted} w-5 h-5`} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search news articles..."
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.text} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm`}
                />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                    <button
                        key={category.value}
                        onClick={() => setSelectedCategory(category.value)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 border ${selectedCategory === category.value
                                ? `${themeStyles.buttonActive} text-white border-transparent shadow-md`
                                : `${themeStyles.buttonSecondary} ${themeStyles.text} border-transparent hover:shadow-sm`
                            }`}
                    >
                        {category.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default NewsFilters;
