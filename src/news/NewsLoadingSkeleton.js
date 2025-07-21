// NewsLoadingSkeleton.js
import React from 'react';
import { useTheme } from '../components/ThemeProvider';

const NewsLoadingSkeleton = () => {
    const { isDark } = useTheme();

    const themeStyles = {
        cardBg: isDark ? 'bg-slate-800' : 'bg-white',
        borderColor: isDark ? 'border-slate-600' : 'border-gray-300',
        skeleton: isDark ? 'bg-slate-700' : 'bg-gray-200',
    };

    const SkeletonItem = ({ isLast = false }) => (
        <div className={`py-4 px-6 ${!isLast ? `border-b ${themeStyles.borderColor}` : ''}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Title skeleton */}
                    <div className={`h-6 ${themeStyles.skeleton} rounded mb-2 animate-pulse`}></div>
                    <div className={`h-6 ${themeStyles.skeleton} rounded mb-3 w-3/4 animate-pulse`}></div>

                    {/* Summary skeleton */}
                    <div className={`h-4 ${themeStyles.skeleton} rounded mb-1 animate-pulse`}></div>
                    <div className={`h-4 ${themeStyles.skeleton} rounded mb-3 w-5/6 animate-pulse`}></div>

                    {/* Meta information skeleton */}
                    <div className="flex items-center gap-4">
                        <div className={`h-3 ${themeStyles.skeleton} rounded w-20 animate-pulse`}></div>
                        <div className={`h-3 ${themeStyles.skeleton} rounded w-16 animate-pulse`}></div>
                        <div className={`h-5 ${themeStyles.skeleton} rounded w-12 animate-pulse`}></div>
                    </div>
                </div>
                <div className={`w-4 h-4 ${themeStyles.skeleton} rounded animate-pulse flex-shrink-0`}></div>
            </div>
        </div>
    );

    return (
        <div className={`${themeStyles.cardBg} rounded-lg border ${themeStyles.borderColor} overflow-hidden`}>
            {[...Array(5)].map((_, index) => (
                <SkeletonItem key={index} isLast={index === 4} />
            ))}
        </div>
    );
};

export default NewsLoadingSkeleton;
