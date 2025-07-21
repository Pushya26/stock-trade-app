// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import axiosInstance from './utils/axiosInstance';
// import logo from './assets/tradelogo.png';
// import { Line } from 'react-chartjs-2';
// import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// const SummaryCard = ({ label, value }) => {
//   const formatter = new Intl.NumberFormat('en-GB', {
//     style: 'currency',
//     currency: 'GBP',
//   });
//   const formattedValue = formatter.format(value);

//   const tooltips = {
//     "Account Value": "Total value of all your current investments in the market.",
//     "Today's Change": "Daily change in portfolio value (in amount and %).",
//     "Total Profit/Loss": "Overall profit or loss from your investments.",
//     "Cash": "Liquid funds currently held in your account.",
//     "Investment Value": "Total amount you initially invested in stocks.",
//   };

//   return (
//     <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 p-5 rounded-2xl shadow-lg text-center text-white border border-gray-700 flex flex-col items-center w-full">
//       <style>
//         {`
//         .tooltip-container {
//           position: relative;
//           display: inline-block;
//           cursor: pointer;
//         }
//         .tooltip-icon {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           width: 16px;
//           height: 16px;
//           font-size: 10px;
//           font-weight: bold;
//           color: #3b82f6;
//           border: 1.5px solid #3b82f6;
//           border-radius: 9999px;
//           background-color: transparent;
//         }
//         .tooltip-text {
//           visibility: hidden;
//           width: max-content;
//           max-width: 200px;
//           background-color: #374151;
//           color: #fff;
//           text-align: left;
//           border-radius: 0.5rem;
//           padding: 0.5rem;
//           position: absolute;
//           z-index: 10;
//           top: 1.8rem;
//           left: 50%;
//           transform: translateX(-50%);
//           white-space: normal;
//           font-size: 0.75rem;
//         }
//         .tooltip-container:hover .tooltip-text {
//           visibility: visible;
//         }
//       `}
//       </style>
//       <div className="text-sm text-gray-300 flex items-center justify-center space-x-1">
//         <span>{label}</span>
//         {tooltips[label] && (
//           <div className="tooltip-container ml-1">
//             <span className="tooltip-icon">i</span>
//             <div className="tooltip-text">{tooltips[label]}</div>
//           </div>
//         )}
//       </div>
//       <div className={`text-2xl font-extrabold tracking-tight mt-1 ${(label.includes("Change") || label.includes("Profit/Loss")) && value < 0 ? 'text-red-400'
//         : (label.includes("Change") || label.includes("Profit/Loss")) && value > 0 ? 'text-green-400'
//           : 'text-white'
//         }`}>
//         {formattedValue}
//       </div>
//     </div>
//   );
// };

// const Portfolio = () => {
//   const [accountValue, setAccountValue] = useState(0);
//   const [todaysChange, setTodaysChange] = useState(0);
//   const [buyingPower, setBuyingPower] = useState(0);
//   const [holdings, setHoldings] = useState([]);
//   const [cash, setCash] = useState(0);

//   // Chart state
//   const [timeframe, setTimeframe] = useState('1W');
//   const [chartData, setChartData] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();
//   const location = useLocation();
//   const isActive = (path) => location.pathname === path;

//   useEffect(() => {
//     const fetchPortfolio = async () => {
//       try {
//         const response = await axiosInstance.get('/trade/portfolio_information/');
//         const summary = response.data.summary;
//         const portfolio = response.data.portfolio;

//         setTodaysChange(parseFloat(summary.todays_changes));
//         setBuyingPower(parseFloat(summary.buying_power));
//         setCash(parseFloat(response.data.cash || 0));

//         const mappedHoldings = portfolio.map((item) => ({
//           symbol: item.symbol,
//           name: item.name,
//           quantity: parseFloat(item.quantity),
//           buy_price: parseFloat(item.buy_price),
//           market_price: parseFloat(item.market_price),
//           holding_value: parseFloat(item.holding_value),
//           pl: parseFloat(item.pl),
//           todays_pl: parseFloat(item.today_pl),
//         }));

//         setHoldings(mappedHoldings);

//         if (summary.account_value) {
//           setAccountValue(parseFloat(summary.account_value));
//         }
//       } catch (error) {
//         console.error('Error fetching portfolio:', error);
//       }
//     };

//     fetchPortfolio();
//   }, []);

//   useEffect(() => {
//     const fetchPortfolioSummary = async () => {
//       try {
//         const res = await axiosInstance.get('/trade/portfolio_information/');
//         setCash(parseFloat(res.data.cash));
//       } catch (error) {
//         console.error('Failed to fetch updated portfolio:', error);
//       }
//     };

//     fetchPortfolioSummary();
//   }, []);

//   // Fetch chart data
//   const fetchAccountValueHistory = async () => {
//     setLoading(true);
//     try {
//       const response = await axiosInstance.get(`/trading-insights/account-value-history/?timeframe=${timeframe}`);

//       if (!response.data || !response.data.data) {
//         setChartData(null);
//         return;
//       }

//       if (response.data.data.length === 0) {
//         setChartData(null);
//         return;
//       }

//       const formattedData = {
//         labels: response.data.data.map(item => item.date),
//         datasets: [
//           {
//             label: 'Account Value (£)',
//             data: response.data.data.map(item => item.total_value),
//             borderColor: '#457eff',
//             backgroundColor: 'rgba(69,126,255,0.08)',
//             fill: true,
//             pointBorderColor: '#457eff',
//             pointBackgroundColor: "#fff",
//             pointRadius: 6,
//             pointHoverRadius: 8,
//             tension: 0.23
//           },
//         ],
//       };

//       setChartData(formattedData);
//     } catch (error) {
//       setChartData(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAccountValueHistory();
//     // eslint-disable-next-line
//   }, [timeframe]);

// const chartOptions = {
//   responsive: true,
//   plugins: {
//     legend: { display: false },
//     tooltip: {
//       callbacks: {
//         label: (context) =>
//           `£${context.raw.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
//       },
//       backgroundColor: "#ffffff",
//       titleColor: "#000000",
//       bodyColor: "#000000",
//       borderColor: "#0f766e",
//       borderWidth: 1,
//       padding: 8, // Smaller padding
//       displayColors: false,
//       titleFont: { size: 13, weight: "600" }, // Smaller font
//       bodyFont: { size: 13, weight: "600" },
//       cornerRadius: 6
//     },
//   },
//   maintainAspectRatio: false,
//   scales: {
//     y: {
//       ticks: {
//         color: "#000000",
//         font: { size: 11, weight: "bold" },
//         callback: (v) => `£${v.toLocaleString()}`,
//       },
//       grid: { color: "#d1d5db" }
//     },
//     x: {
//       ticks: {
//         color: "#000000",
//         font: { size: 11, weight: "bold" }
//       },
//       grid: { color: "#d1d5db" }
//     }
//   },
//   elements: {
//     line: {
//       borderWidth: 3,
//       borderColor: "#0f766e",  // ✅ Teal color
//       tension: 0.23
//     },
//     point: {
//       radius: 5,
//       backgroundColor: "#ffffff",
//       borderColor: "#0f766e",  // ✅ Teal color
//       borderWidth: 2
//     }
//   }
// };


//   const handleLogout = () => {
//     window.location.href = '/';
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-white">
//       {/* Header */}
//       <header className="bg-slate-800 border-b border-slate-700 fixed top-0 w-full z-50">
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-2">
//               <img src={logo} alt="Logo" className="w-8 h-8" />
//               <span className="text-xl font-semibold">EducateTrade</span>
//             </div>
//             <nav className="flex items-center space-x-16 text-xl">
//               <button
//                 onClick={() => navigate('/portfolio')}
//                 className={`font-semibold ${isActive('/portfolio') ? 'text-white' : 'text-blue-400 hover:text-blue-300'
//                   }`}
//               >
//                 Portfolio
//               </button>
//               <button
//                 onClick={() => navigate('/trade')}
//                 className={`font-semibold ${isActive('/trade') ? 'text-white' : 'text-blue-400 hover:text-blue-300'
//                   }`}
//               >
//                 Trade
//               </button>
//               <button
//                 onClick={() => navigate('/research')}
//                 className={`font-semibold ${isActive('/research') ? 'text-white' : 'text-blue-400 hover:text-blue-300'
//                   }`}
//               >
//                 Research
//               </button>
//               <button
//                 onClick={() => navigate('/orders')}
//                 className={`font-semibold ${
//                 isActive('/orders') ? 'text-white' : 'text-blue-400 hover:text-blue-300'
//                 }`}
//               >
//                 Orders
//               </button>
//             </nav>
//             <div className="flex items-center space-x-4">
//               <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
//                 £{cash.toFixed(2)}
//               </div>
//               <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium">
//                 LOGOUT
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Content Layout */}
//       <main className="min-h-screen max-w-[90rem] mx-auto px-4 pt-[60px]">
//       <div className="max-w-7xl mx-auto px-6 py-10">
//         {/* Summary Cards */}
//         <div className="flex flex-row gap-6 mb-8 w-full">
//           <div className="flex-1"><SummaryCard label="Account Value" value={accountValue} /></div>
//           <div className="flex-1"><SummaryCard label="Today's Change" value={todaysChange} /></div>
//           <div className="flex-1"><SummaryCard label="Total Profit/Loss" value={buyingPower} /></div>
//           <div className="flex-1"><SummaryCard label="Cash" value={cash} /></div>
//         </div>
//         {/* Holdings table and chart in one row */}
//         <div className="flex flex-col md:flex-row gap-5 items-start md:items-stretch relative">
//           {/* Holdings Table - Reduced width content */}
//           <div
//             className={`bg-white text-gray-900 rounded-2xl shadow-xl mb-8 md:mb-0 overflow-x-auto`}
//             style={{
//               flex: "3.5",
//               minWidth: 420,
//               zIndex: 10,
//               marginRight: 0,
//               height: 'fit-content', // Changed from auto to fit-content
//               display: 'flex',
//               flexDirection: 'column'
//             }}
//           >
//             {holdings.length === 0 ? (
//               <div className="text-center text-gray-400 py-3">No Entries Found</div>
//             ) : (
//               <table className="w-full text-sm border border-gray-200 rounded-2xl">
//                 <thead className="bg-gray-100 text-gray-700 sticky top-0">
//                   <tr>
//                     { [
//                         { key: 'Symbol', width: '10%' },
//                         { key: 'Company', width: '20%' },
//                         { key: 'Qty', width: '8%' }, // Changed "Quantity" to "Qty" to save space
//                         { key: 'Buy Price', width: '12%' }, // Changed "Buy Price" to "Buy"
//                         { key: 'Market Price', width: '12%' }, // Changed "Market Price" to "Price"
//                         { key: 'Holding Value', width: '13%' }, // Changed "Holding Value" to "Value"
//                         { key: 'P&L', width: '12%' },
//                         { key: "Today's P&L", width: '13%' }, // Changed "Today's P&L" to "Today"
//                       ].map((header) => (
//                       <th
//                         key={header.key}
//                         className="px-2 py-2 border text-center font-semibold align-middle whitespace-nowrap"
//                         style={{
//                           verticalAlign: 'middle',
//                           background: '#f5f5f5',
//                           fontWeight: 700,
//                           fontSize: '0.9rem', // Slightly smaller font
//                           width: header.width
//                         }}
//                       >
//                         {header.key}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//         <tbody className="divide-y divide-gray-200">
//         {holdings.map((stock, index) => {
//           const holdingValue = stock.buy_price * stock.quantity;
//           return (
//             <tr key={index} className="text-center transition hover:bg-gray-100">
//               <td className="px-2 py-2 border align-middle text-left whitespace-nowrap">{stock.symbol}</td>
//               <td className="px-2 py-2 border align-middle text-left break-words max-w-[200px]" title={stock.name}>
//                   {stock.name}
//               </td>
//               <td className="px-2 py-2 border align-middle text-left whitespace-nowrap">{stock.quantity}</td>
//               <td className="px-2 py-2 border align-middle text-left whitespace-nowrap">£{stock.buy_price.toFixed(2)}</td>
//               <td className="px-2 py-2 border align-middle text-left whitespace-nowrap">£{stock.market_price.toFixed(2)}</td>
//               <td className="px-2 py-2 border align-middle text-left whitespace-nowrap">£{holdingValue.toFixed(2)}</td>
//               <td className={`px-2 py-2 border align-middle text-left whitespace-nowrap font-medium ${stock.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                 £{stock.pl.toFixed(2)}
//               </td>
//               <td className={`px-2 py-2 border align-middle text-left whitespace-nowrap font-medium ${stock.todays_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                 £{stock.todays_pl.toFixed(2)}
//               </td>
//             </tr>
//           );
//         })}
//       </tbody>
//               </table>
//             )}
//           </div>

//           {/* Right Side: Graph - Takes less space and closer to table */}
//           <div
//             className="flex-shrink-0"
//             style={{
//               flex: "2", // Takes 2 parts of available space
//               marginLeft: 0, // Removed margin to bring chart closer
//               position: 'relative',
//               right: '0px', // Removed negative right value
//               zIndex: 9,
//               minWidth: 320 // Slightly reduced minimum width
//             }}
//           >
//             <div className="bg-white text-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-300 transition-all duration-300">
//               <div className="flex items-center justify-between mb-4">
//               <h2 className="text-xl font-bold text-slate-700 tracking-wide uppercase">Performance History</h2>
//               <button
//                 onClick={fetchAccountValueHistory}
//                 className="text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-900 text-white rounded-md border border-slate-600 transition"
//               >
//                 Refresh
//               </button>
//               </div>
//               <div className="flex flex-wrap gap-2 mb-4">
//                 {['1W', '1M', '3M', '6M', '1Y'].map(range => (
//                   <button
//                     key={range}
//                     onClick={() => setTimeframe(range)}
//                     className={`px-3 py-1 rounded-full font-semibold transition text-sm
//                       ${timeframe === range
//                         ? "bg-blue-600 text-white shadow"
//                         : "bg-gray-200 text-blue-700 hover:bg-blue-100 hover:text-blue-700"}
//                     `}
//                   >
//                     {range}
//                   </button>
//                 ))}
//               </div>
//               <div className="w-full" style={{height: 240}}>
//                 {loading ? (
//                   <p className="text-center text-gray-600">Loading...</p>
//                 ) : chartData ? (
//                   <Line data={chartData} options={chartOptions} height={220} />
//                 ) : (
//                   <p className="text-center text-gray-600">No data available</p>
//                 )}
//               </div>
//             </div> 
//            </div>
//         </div>
//       </div>
//       </main>
//     </div>
//   );
// };



// export default Portfolio;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from './utils/axiosInstance';
import logo from './assets/tradelogo.png';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useTheme } from './components/ThemeProvider';
import { FaSun, FaMoon } from "react-icons/fa";
import { FiRefreshCw } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SummaryCard = ({ label, value, isDark }) => {
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  });
  const formattedValue = formatter.format(value);

  const tooltips = {
    "Account Value": "Total value of all your current investments in the market.",
    "Today's Change": "Daily change in portfolio value (in amount and %).",
    "Total Profit/Loss": "Overall profit or loss from your investments.",
    "Cash": "Liquid funds currently held in your account.",
    "Investment Value": "Total amount you initially invested in stocks.",
  };

  return (
    <div className={`${isDark
      ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 text-white border-gray-700'
      : 'bg-gradient-to-br from-white via-gray-50 to-white text-gray-900 border-gray-200'
      } p-5 rounded-2xl shadow-lg text-center border flex flex-col items-center w-full transition-colors`}>
      <style>
        {`
        .tooltip-container {
          position: relative;
          display: inline-block;
          cursor: pointer;
        }
        .tooltip-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          font-size: 10px;
          font-weight: bold;
          color: #3b82f6;
          border: 1.5px solid #3b82f6;
          border-radius: 9999px;
          background-color: transparent;
        }
        .tooltip-text {
          visibility: hidden;
          width: max-content;
          max-width: 200px;
          background-color: ${isDark ? '#374151' : '#1f2937'};
          color: #fff;
          text-align: left;
          border-radius: 0.5rem;
          padding: 0.5rem;
          position: absolute;
          z-index: 10;
          top: 1.8rem;
          left: 50%;
          transform: translateX(-50%);
          white-space: normal;
          font-size: 0.75rem;
        }
        .tooltip-container:hover .tooltip-text {
          visibility: visible;
        }
      `}
      </style>
      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} flex items-center justify-center space-x-1`}>
        <span>{label}</span>
        {tooltips[label] && (
          <div className="relative group ml-1">
            {/* Tooltip Icon */}
            <span className="tooltip-icon text-xs bg-gray-300 dark:bg-gray-600 text-black dark:text-white px-1.5 rounded-full cursor-pointer">
              i
            </span>

            {/* Tooltip Box (Shown at the Bottom) */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2
                            bg-white dark:bg-gray-700 text-black dark:text-white
                            text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 shadow-md
                            whitespace-pre-line z-50 w-52
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {tooltips[label]}
            </div>
          </div>
        )}
      </div>
      <div className={`text-2xl font-extrabold tracking-tight mt-1 ${(label.includes("Change") || label.includes("Profit/Loss")) && value < 0 ? 'text-red-500 dark:text-red-400'
        : (label.includes("Change") || label.includes("Profit/Loss")) && value > 0 ? 'text-green-500 dark:text-green-400'
          : isDark ? 'text-white' : 'text-gray-900'
        }`}>
        {formattedValue}
      </div>
    </div>
  );
};

const Portfolio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, setIsDark } = useTheme();

  const [accountValue, setAccountValue] = useState(0);
  const [todaysChange, setTodaysChange] = useState(0);
  const [buyingPower, setBuyingPower] = useState(0);
  const [holdings, setHoldings] = useState([]);
  const [cash, setCash] = useState(0);

  // Chart state
  const [timeframe, setTimeframe] = useState('1W');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await axiosInstance.get('/trade/portfolio_information/');
        const summary = response.data.summary;
        const portfolio = response.data.portfolio;

        setTodaysChange(parseFloat(summary.todays_changes));
        setBuyingPower(parseFloat(summary.buying_power));
        setCash(parseFloat(response.data.cash || 0));

        const mappedHoldings = portfolio.map((item) => ({
          symbol: item.symbol,
          name: item.name,
          quantity: parseFloat(item.quantity),
          buy_price: parseFloat(item.buy_price),
          market_price: parseFloat(item.market_price),
          holding_value: parseFloat(item.holding_value),
          pl: parseFloat(item.pl),
          todays_pl: parseFloat(item.today_pl),
        }));

        setHoldings(mappedHoldings);

        if (summary.account_value) {
          setAccountValue(parseFloat(summary.account_value));
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      }
    };

    fetchPortfolio();
  }, []);

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

  // Fetch chart data
  const fetchAccountValueHistory = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/trading-insights/account-value-history/?timeframe=${timeframe}`);

      if (!response.data || !response.data.data) {
        setChartData(null);
        return;
      }

      if (response.data.data.length === 0) {
        setChartData(null);
        return;
      }

      const formattedData = {
        labels: response.data.data.map(item => item.date),
        datasets: [
          {
            label: 'Account Value (£)',
            data: response.data.data.map(item => item.total_value),
            borderColor: isDark ? '#60a5fa' : '#2563eb',
            backgroundColor: isDark ? 'rgba(96,165,250,0.08)' : 'rgba(37,99,235,0.08)',
            fill: true,
            pointBorderColor: isDark ? '#60a5fa' : '#2563eb',
            pointBackgroundColor: isDark ? '#1f2937' : "#fff",
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.23
          },
        ],
      };

      setChartData(formattedData);
    } catch (error) {
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountValueHistory();
    // eslint-disable-next-line
  }, [timeframe, isDark]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) =>
            `£${context.raw.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        },
        backgroundColor: isDark ? "#374151" : "#ffffff",
        titleColor: isDark ? "#ffffff" : "#000000",
        bodyColor: isDark ? "#ffffff" : "#000000",
        borderColor: isDark ? "#60a5fa" : "#2563eb",
        borderWidth: 1,
        padding: 8,
        displayColors: false,
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 13, weight: "600" },
        cornerRadius: 6
      },
    },
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: {
          color: isDark ? "#d1d5db" : "#374151",
          font: { size: 11, weight: "bold" },
          callback: (v) => `£${v.toLocaleString()}`,
        },
        grid: {
          color: isDark ? "#374151" : "#d1d5db",
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: isDark ? "#d1d5db" : "#374151",
          font: { size: 11, weight: "bold" }
        },
        grid: {
          color: isDark ? "#374151" : "#d1d5db",
          drawBorder: false
        }
      }
    },
    elements: {
      line: {
        borderWidth: 3,
        borderColor: isDark ? "#60a5fa" : "#2563eb",
        tension: 0.23
      },
      point: {
        radius: 5,
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        borderColor: isDark ? "#60a5fa" : "#2563eb",
        borderWidth: 2
      }
    }
  };

  const handleLogout = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed top-0 w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">EducateTrade</span>
            </div>
            <nav className="flex items-center space-x-8 text-lg">
              <button
                onClick={() => navigate('/portfolio')}
                className={`font-medium transition-colors ${isActive('/portfolio')
                  ? 'text-gray-900 dark:text-white'
                  : 'text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300'
                  }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/trade')}
                className={`font-medium transition-colors ${isActive('/trade')
                  ? 'text-gray-900 dark:text-white'
                  : 'text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300'
                  }`}
              >
                Trade
              </button>
              <button
                onClick={() => navigate('/research')}
                className={`font-medium transition-colors ${isActive('/research')
                  ? 'text-gray-900 dark:text-white'
                  : 'text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300'
                  }`}
              >
                Research
              </button>
              <button
                onClick={() => navigate('/news')}
                className={`font-medium transition-colors ${isActive('/news')
                  ? 'text-gray-900 dark:text-white'
                  : 'text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300'
                  }`}
              >
                News
              </button>
              <button
                onClick={() => navigate('/orders')}
                className={`font-medium transition-colors ${isActive('/orders')
                  ? 'text-gray-900 dark:text-white'
                  : 'text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300'
                  }`}
              >
                Orders
              </button>
            </nav>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDark(prev => !prev)}
                className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {isDark ? (
                  <FaMoon className="text-gray-300" />
                ) : (
                  <FaSun className="text-black" />
                )}
              </button>
              <div className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold">
                £{cash.toFixed(2)}
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="min-h-screen max-w-[90rem] mx-auto px-4 pt-[80px]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Summary Cards */}
          <div className="flex flex-row gap-6 mb-8 w-full">
            <div className="flex-1"><SummaryCard label="Account Value" value={accountValue} isDark={isDark} /></div>
            <div className="flex-1"><SummaryCard label="Today's Change" value={todaysChange} isDark={isDark} /></div>
            <div className="flex-1"><SummaryCard label="Total Profit/Loss" value={buyingPower} isDark={isDark} /></div>
            <div className="flex-1"><SummaryCard label="Cash" value={cash} isDark={isDark} /></div>
          </div>

          {/* Holdings table and chart in one row */}
          <div className="flex flex-col md:flex-row gap-5 items-start md:items-stretch relative">
            {/* Holdings Table */}
            <div
              className={`${isDark
                ? 'bg-gray-800 text-gray-100 border-gray-700'
                : 'bg-white text-gray-900 border-gray-200'
                } rounded-2xl shadow-xl mb-8 md:mb-0 overflow-x-auto border transition-colors`}
              style={{
                flex: "3.5",
                minWidth: 420,
                zIndex: 10,
                marginRight: 0,
                height: 'fit-content',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {holdings.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No holdings found
                </div>
              ) : (
                <table className={`w-full text-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-2xl`}>
                  <thead className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} sticky top-0`}>
                    <tr>
                      {[
                        { key: 'Symbol', width: '10%' },
                        { key: 'Company', width: '20%' },
                        { key: 'Qty', width: '8%' },
                        { key: 'Buy Price', width: '12%' },
                        { key: 'Market Price', width: '12%' },
                        { key: 'Holding Value', width: '13%' },
                        { key: 'P&L', width: '12%' },
                        { key: "Today's P&L", width: '13%' },
                      ].map((header) => (
                        <th
                          key={header.key}
                          className={`px-2 py-2 border text-center font-semibold align-middle whitespace-nowrap ${isDark ? 'border-gray-600' : 'border-gray-300'
                            }`}
                          style={{
                            verticalAlign: 'middle',
                            background: isDark ? '#374151' : '#f5f5f5',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            width: header.width
                          }}
                        >
                          {header.key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-600' : 'divide-gray-200'}`}>
                    {holdings.map((stock, index) => {
                      const holdingValue = stock.buy_price * stock.quantity;
                      return (
                        <tr
                          key={index}
                          className={`text-center transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                        >
                          <td className={`px-2 py-2 border align-middle text-left whitespace-nowrap font-medium text-blue-600 dark:text-blue-400 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            {stock.symbol}
                          </td>
                          <td className={`px-2 py-2 border align-middle text-left break-words max-w-[200px] ${isDark ? 'border-gray-600' : 'border-gray-300'}`} title={stock.name}>
                            {stock.name}
                          </td>
                          <td className={`px-2 py-2 border align-middle text-left whitespace-nowrap ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            {stock.quantity}
                          </td>
                          <td className={`px-2 py-2 border align-middle text-left whitespace-nowrap ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            £{stock.buy_price.toFixed(2)}
                          </td>
                          <td className={`px-2 py-2 border align-middle text-left whitespace-nowrap ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            £{stock.market_price.toFixed(2)}
                          </td>
                          <td className={`px-2 py-2 border align-middle text-left whitespace-nowrap font-medium ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            £{holdingValue.toFixed(2)}
                          </td>
                          <td className={`px-2 py-2 border align-middle text-left whitespace-nowrap font-medium ${stock.pl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            } ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            £{stock.pl.toFixed(2)}
                          </td>
                          <td className={`px-2 py-2 border align-middle text-left whitespace-nowrap font-medium ${stock.todays_pl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            } ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            £{stock.todays_pl.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Right Side: Graph */}
            <div
              className="flex-shrink-0"
              style={{
                flex: "2",
                marginLeft: 0,
                position: 'relative',
                right: '0px',
                zIndex: 9,
                minWidth: 320
              }}
            >
              <div className={`${isDark
                ? 'bg-gray-800 text-gray-100 border-gray-700'
                : 'bg-white text-gray-900 border-gray-200'
                } rounded-3xl shadow-2xl p-6 border transition-all duration-300`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-bold tracking-wide uppercase ${isDark ? 'text-gray-200' : 'text-slate-700'
                    }`}>
                    Performance History
                  </h2>
                  <button
                    onClick={fetchAccountValueHistory}
                    className={`flex items-center space-x-2 text-sm px-3 py-1.5 rounded-md transition-colors ${isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300'
                      } border`}
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['1W', '1M', '3M', '6M', '1Y'].map(range => (
                    <button
                      key={range}
                      onClick={() => setTimeframe(range)}
                      className={`px-3 py-1 rounded-full font-semibold transition text-sm ${timeframe === range
                        ? "bg-blue-600 dark:bg-blue-500 text-white shadow"
                        : isDark
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
                <div className="w-full" style={{ height: 240 }}>
                  {loading ? (
                    <div className={`flex items-center justify-center h-full ${isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  ) : chartData ? (
                    <Line data={chartData} options={chartOptions} height={220} />
                  ) : (
                    <div className={`flex items-center justify-center h-full ${isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Portfolio;