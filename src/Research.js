// Research.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "./utils/axiosInstance";
import logo from "./assets/tradelogo.png";
import { FiSearch } from "react-icons/fi";
import { Line } from "react-chartjs-2";
import { FaSun, FaMoon } from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { useTheme } from './components/ThemeProvider';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const StockChart = React.forwardRef(({ chartData, options }, ref) => {
  return (
    <Line
      ref={ref}
      data={chartData}
      options={options}
      className="w-full h-full"
      style={{ overflow: "hidden" }}
    />
  );
});

const Research = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const chartRef = useRef();
  const { isDark, setIsDark } = useTheme();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [stockInfo, setStockInfo] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [timeRange, setTimeRange] = useState("1wk");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cash, setCash] = useState(0);

  const isActive = (path) => location.pathname === path;

  // Theme-based styles
  const themeStyles = {
    background: isDark ? 'bg-slate-900' : 'bg-gray-50',
    headerBg: isDark ? 'bg-slate-800' : 'bg-white',
    headerBorder: isDark ? 'border-slate-700' : 'border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    cardBg: isDark ? 'bg-slate-800' : 'bg-white',
    cardBorder: isDark ? 'border-slate-700' : 'border-gray-200',
    inputBg: isDark ? 'bg-slate-800' : 'bg-white',
    inputBorder: isDark ? 'border-slate-600' : 'border-gray-300',
    dropdownBg: isDark ? 'bg-slate-700' : 'bg-white',
    dropdownBorder: isDark ? 'border-slate-600' : 'border-gray-200',
    dropdownHover: isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-50',
    buttonPrimary: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600',
    buttonSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300',
    buttonActive: isDark ? 'bg-blue-600' : 'bg-blue-500',
    loadingBg: isDark ? 'bg-slate-700' : 'bg-gray-200',
    metricBg: isDark ? 'bg-slate-900' : 'bg-gray-50',
    descriptionBg: isDark ? 'bg-slate-900' : 'bg-gray-50',
    descriptionBorder: isDark ? 'border-slate-700' : 'border-gray-200',
    gridColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.1)',
    tickColor: isDark ? 'white' : '#374151',
    legendColor: isDark ? 'white' : '#374151',
  };

  useEffect(() => {
    const fetchPortfolioSummary = async () => {
      try {
        const res = await axiosInstance.get('/trade/portfolio_information/');
        setCash(parseFloat(res.data.cash));
      } catch (error) {
        console.error('Failed to fetch updated portfolio:', error);
      }
    };
    fetchPortfolioSummary();
  }, []);

  const handleLogout = () => {
    window.location.href = '/';
  };

  const fetchSuggestions = useCallback(async (query) => {
    if (query.length < 1) return;
    try {
      const res = await axiosInstance.post("/stocks/search-tickers", { query });
      setSearchResults(res.data);
      setShowSuggestions(res.data.length > 0);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    const isValidSymbol = /^[A-Z]{2,5}(\.L)?$/.test(searchTerm.trim().toUpperCase());
    if (!isValidSymbol) {
      fetchSuggestions(searchTerm);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm, fetchSuggestions]);

  const fetchStockDetails = useCallback(async (symbol) => {
    if (!symbol) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await axiosInstance.post("/stocks/research-info", { symbol });
      const data = res.data;

      const isDataEmpty =
        !data ||
        (data.companyName === "N/A (Info Unavailable)" &&
          data.description === "No description available." &&
          (data.currentPrice === "N/A" || data.currentPrice === 0));

      if (isDataEmpty) {
        setError(`No details available for '${symbol}'.`);
        setStockInfo(null);
      } else {
        setStockInfo(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch stock details.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchChartData = useCallback(async (symbol, range) => {
    try {
      const res = await axiosInstance.get(`/historical/${symbol}/`, {
        params: { range }
      });
      const { data } = res;
      const allLabels = data.data.map((d) => d.date);
      const allPrices = data.data.map((d) => d.price);

      const labels = range === "1wk" ? allLabels.slice(-7) : allLabels;
      const prices = range === "1wk" ? allPrices.slice(-7) : allPrices;

      const formatted = {
        labels: labels,
        datasets: [
          {
            label: "Stock Price (£)",
            data: prices,
            borderColor: isDark ? "rgba(59, 130, 246, 1)" : "rgba(37, 99, 235, 1)",
            backgroundColor: isDark ? "rgba(59, 130, 246, 0.4)" : "rgba(37, 99, 235, 0.4)",
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 6,
            borderWidth: 2,
          },
        ],
      };

      setChartData(formatted);
    } catch (err) {
      console.error(err);
      setChartData(null);
      setError("Failed to fetch chart data.");
    }
  }, [isDark]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      let symbol = searchTerm.trim().toUpperCase();
      if (!symbol.includes(".")) symbol += ".L";
      setSelectedSymbol(symbol);
      setShowSuggestions(false);
      fetchStockDetails(symbol);
      fetchChartData(symbol, timeRange);
    }
  };

  const handleSuggestionClick = (symbol, name) => {
    setSearchTerm(symbol);
    setSelectedSymbol(symbol);
    setShowSuggestions(false);
    fetchStockDetails(symbol);
    fetchChartData(symbol, timeRange);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        bottom: 40,
        left: 40,
        right: 40,
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: themeStyles.legendColor,
          font: {
            weight: "bold"
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx) => `£${ctx.raw.toFixed(2)}`,
          title: (tooltipItems) => {
            const date = new Date(tooltipItems[0].label);
            return date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            });
          }
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x'
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: themeStyles.tickColor,
          autoSkip: true,
          maxTicksLimit: 10,
          maxRotation: 0,
          callback: function (value) {
            const label = this.getLabelForValue(value);
            const date = new Date(label);
            return date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short"
            });
          }
        },
        grid: {
          color: themeStyles.gridColor
        }
      },
      y: {
        ticks: {
          color: themeStyles.tickColor,
          callback: (value) => `£${value.toFixed(2)}`
        },
        grid: {
          color: themeStyles.gridColor
        },
        beginAtZero: false,
        grace: "25%",
      }
    }
  };

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
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors
                          dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                {isDark ? (
                  <FaMoon className="text-gray-300" /> // active dark mode
                ) : (
                  <FaSun className="text-black" /> // active light mode
                )}
              </button>
              <div className={`${themeStyles.buttonPrimary} text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200`}>
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

      <main className="min-h-screen max-w-[90rem] mx-auto px-4 pt-[120px]">
        <div className="w-full flex justify-center mb-6">
          <div className="w-full max-w-[1000px] relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              onFocus={() => {
                if (searchTerm && searchResults.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
              placeholder="Enter UK Stock Symbol (e.g., BARC, BP)"
              className={`w-full p-3 rounded-md ${themeStyles.inputBg} ${themeStyles.text} border ${themeStyles.inputBorder} transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            <button onClick={handleSearch} className={`absolute top-3 right-4 ${themeStyles.text} hover:text-blue-500 transition-colors duration-200`}>
              <FiSearch size={20} />
            </button>
            {showSuggestions && searchResults.length > 0 && (
              <div className={`absolute z-10 w-full ${themeStyles.dropdownBg} border ${themeStyles.dropdownBorder} rounded-md mt-2 shadow-lg ring-1 ring-opacity-5 overflow-hidden transition-colors duration-200`}>
                <div className="max-h-[50vh] overflow-y-auto">
                  {searchResults.map((res, index) => (
                    <div
                      key={`${res.symbol}-${index}`}
                      className={`px-4 py-2 ${themeStyles.dropdownHover} cursor-pointer border-b ${themeStyles.dropdownBorder} last:border-b-0 transition-colors duration-200`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionClick(res.symbol, res.name);
                      }}
                    >
                      <strong>{res.symbol}</strong> - {res.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

        {isLoading && (
          <div className="space-y-6">
            <div className={`animate-pulse h-32 ${themeStyles.loadingBg} rounded-lg`}></div>
            <div className={`animate-pulse h-60 ${themeStyles.loadingBg} rounded-lg`}></div>
          </div>
        )}

        {stockInfo && (
          <div className="w-full flex justify-center">
            <div className="mt-4" />
            <div className={`w-full max-w-[1000px] ${themeStyles.cardBg} rounded-xl border ${themeStyles.cardBorder} shadow-lg pt-6 pb-3 px-6 mb-0 transition-colors duration-200`}>
              <h3 className="text-3xl font-bold text-blue-500 mb-6">
                {stockInfo.companyName} ({stockInfo.symbol})
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {[
                  ["Current Price", stockInfo.currentPrice],
                  ["Market Cap", stockInfo.marketCap],
                  ["P/E Ratio", stockInfo.peRatio],
                  ["Industry", stockInfo.industry],
                  ["Sector", stockInfo.sector],
                  ["Dividend Yield", stockInfo.dividendYield],
                ].map(([label, val]) => (
                  <div key={label} className={`${themeStyles.metricBg} px-3 py-3 rounded-md border ${themeStyles.cardBorder} transition-colors duration-200`}>
                    <p className={`${themeStyles.textMuted} text-sm`}>{label}</p>
                    <p className={`${themeStyles.text} font-semibold text-base mt-1`}>{val}</p>
                  </div>
                ))}
              </div>
              {stockInfo.description && (
                <div className="mt-6 w-full">
                  <h4 className={`text-xl font-semibold ${themeStyles.text} mb-2`}>Company Description</h4>
                  <p className={`max-h-48 overflow-y-auto pr-3 ${themeStyles.descriptionBg} p-4 rounded-lg border ${themeStyles.descriptionBorder} ${themeStyles.textSecondary} text-sm leading-relaxed transition-colors duration-200`}>
                    {stockInfo.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4" />

        {chartData && (
          <>
            <div className="w-full flex justify-center mt-0">
              <div className="w-full max-w-[1000px]">
                <p className={`text-sm ${themeStyles.textSecondary} font-medium mb-1`}>
                  Select a time range to view the stock's historical performance:
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {['1wk', '1mo', '6mo', '1y'].map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setTimeRange(range);
                        fetchChartData(selectedSymbol, range);
                      }}
                      className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${timeRange === range
                        ? `${themeStyles.buttonActive} text-white border-blue-500 shadow-sm`
                        : `${themeStyles.buttonSecondary} ${themeStyles.textSecondary} hover:bg-blue-500 hover:text-white`
                        }`}
                    >
                      {range.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full flex justify-center mb-6">
              <div className={`w-full max-w-[1000px] h-[560px] ${themeStyles.cardBg} p-2 rounded-xl border ${themeStyles.cardBorder} overflow-hidden shadow-lg transition-colors duration-200`}>
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => chartRef.current.resetZoom()}
                    className={`text-xs ${themeStyles.buttonSecondary} ${themeStyles.text} px-2 py-1 rounded-md hover:bg-blue-500 hover:text-white transition-colors duration-200`}
                  >
                    Reset Zoom
                  </button>
                </div>
                <div className="w-full h-full">
                  <StockChart ref={chartRef} chartData={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Research;