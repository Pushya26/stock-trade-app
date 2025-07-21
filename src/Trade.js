// import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import axiosInstance from './utils/axiosInstance';
// import logo from './assets/tradelogo.png';
// import { useClickOutside } from "./hooks/useClickOutside";

// const Trade = () => {
//   // ... existing state variables ...
//   const [cash, setCash] = useState(0);
//   const [portfolio, setPortfolio] = useState({});
//   const [showTradePanel, setShowTradePanel] = useState(false);
//   const [tradeType, setTradeType] = useState("");
//   const [prices, setPrices] = useState({});
//   const [selectedStock, setSelectedStock] = useState('');

//   // UPDATED: Separate quantity states for market and limit orders
//   const [marketQuantity, setMarketQuantity] = useState(0);
//   const [limitQuantity, setLimitQuantity] = useState(0);

//   const [orderType, setOrderType] = useState('market');
//   const [limitPrice, setLimitPrice] = useState('');
//   const [transactions, setTransactions] = useState([]);
//   const [watchlist, setWatchlist] = useState([]);
//   const navigate = useNavigate();
//   const [lookupSymbol, setLookupSymbol] = useState('');
//   const [lookupResult, setLookupResult] = useState(null);
//   const [lookupError, setLookupError] = useState(null);
//   const [marketStatusData, setMarketStatusData] = useState(null);
//   const [pendingOrders, setPendingOrders] = useState([]);
//   const location = useLocation();
//   const isActive = (path) => location.pathname === path;

//   // Optimized search states
//   const [suggestions, setSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [symbolFetching, setSymbolFetching] = useState(false);
//   const inputRef = useRef(null);
//   const [successMessage, setSuccessMessage] = useState('');
//   const [watchlistMessage, setWatchlistMessage] = useState('');
//   // Add search cache to avoid repeated API calls
//   const searchCacheRef = useRef(new Map());
//   const abortControllerRef = useRef(null);
//    const getCurrentQuantity = () => {
//     return orderType === 'market' ? marketQuantity : limitQuantity;
//   };
//   const quantity = getCurrentQuantity(); 

//   useClickOutside(inputRef, () => setShowSuggestions(false));



//   // UPDATED: Helper function to set quantity based on order type
//   const setCurrentQuantity = (value) => {
//     if (orderType === 'market') {
//       setMarketQuantity(value);
//     } else {
//       setLimitQuantity(value);
//     }
//   };


//   const handleLogout = () => {
//     window.location.href = '/';
//   };

//   const API_BASE_URL = "http://localhost:8000/api/stocks";

//   // Optimized debounced search with caching
//   const fetchSuggestions = useMemo(() => {
//     const debouncedSearch = (callback, delay) => {
//       let timeoutId;
//       return (...args) => {
//         clearTimeout(timeoutId);
//         timeoutId = setTimeout(() => callback(...args), delay);
//       };
//     };

//     const searchFunction = async (value) => {
//       // Cancel previous request
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }

//       const trimmedValue = value.trim().toUpperCase();

//       if (!trimmedValue) {
//         setSuggestions([]);
//         setShowSuggestions(true);
//         setSymbolFetching(false);
//         return;
//       }

//       // Check cache first
//       if (searchCacheRef.current.has(trimmedValue)) {
//         const cachedData = searchCacheRef.current.get(trimmedValue);
//         setSuggestions(cachedData);
//         setShowSuggestions(true);
//         setSymbolFetching(false);
//         return;
//       }

//       // Create new abort controller for this request
//       abortControllerRef.current = new AbortController();
//       setSymbolFetching(true);
//       setLookupError(null);

//       try {
//         const controller = abortControllerRef.current;

//         // Add timeout to the request
//         const timeoutId = setTimeout(() => {
//           controller.abort();
//         }, 10000); // 10 second timeout

//         const response = await fetch(`${API_BASE_URL}/${trimmedValue}/`, {
//           signal: controller.signal,
//           headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json',
//           },
//         });

//         clearTimeout(timeoutId);

//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();

//         const processedData = Array.isArray(data) ? data.slice(0, 10) : [data];

//         // Cache the results for 5 minutes
//         searchCacheRef.current.set(trimmedValue, processedData);
//         setTimeout(() => {
//           searchCacheRef.current.delete(trimmedValue);
//         }, 5 * 60 * 1000); // 5 minutes

//         setSuggestions(processedData);
//         setShowSuggestions(true);

//       } catch (error) {
//         if (error.name !== 'AbortError') {
//           console.error('Search error:', error);
//           setLookupError(`Search failed: ${error.message}`);
//           setSuggestions([]);
//           setShowSuggestions(false);
//         }
//       } finally {
//         setSymbolFetching(false);
//       }
//     };

//     // Return debounced version with 300ms delay
//     return debouncedSearch(searchFunction, 10);
//   }, [API_BASE_URL]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
//     };
//   }, []);

//   const addSearchedStockToWatchlist = async () => {
//     if (watchlist.length >= 5) {
//       alert("Maximum of 10 stocks allowed in your watchlist. Remove one to add more.");
//       return;
//     }

//     if (lookupResult && lookupResult.symbol) {
//       const symbol = lookupResult.symbol.toUpperCase();

//       // Check if already in local watchlist
//       if (watchlist.some(w => w.symbol === symbol)) {
//          setWatchlistMessage('Stock is already in your watchlist!');
//          setTimeout(() => setWatchlistMessage(''), 5000);
//         return;
//            }

//       try {
//         const res = await axiosInstance.post('/watchlist/', { symbol });
//         const data = res.data;
//         console.log("Watchlist add success:", res.data);

//         setWatchlist(prev => [...prev, data]);

//         setWatchlistMessage('Stock added to watchlist Successfully');
//         setTimeout(() => setWatchlistMessage(''), 5000);

//         // Set prices (same as before)
//         setPrices(prev => ({
//           ...prev,
//           [symbol]: {
//             price: parseFloat(lookupResult.price) || 0,
//             change: parseFloat(lookupResult.change) || 0,
//             changePercent: parseFloat(lookupResult.changePercent) || 0,
//             previousClose: parseFloat(lookupResult.price) || 0,
//             volume: 0,
//             marketCap: 0,
//             companyName: lookupResult.name || symbol,
//           },
//         }));

//         setSelectedStock(symbol);
//         setLookupSymbol('');
//         setLookupResult(null);
//         } catch (error) {
//             console.error("Error adding to watchlist:", error);
//             setWatchlistMessage(error.response?.data?.detail || "Failed to add to watchlist");
//             setTimeout(() => setWatchlistMessage(''), 5000);
//           }
//     }
//   };

//   const refreshPortfolio = async () => {
//     try {
//       const res = await axiosInstance.get('/trade/portfolio_information/');
//       setPortfolio(res.data.portfolio_snapshot || {});
//       setCash(res.data.cash || 0);
//     } catch (error) {
//       console.error('Error refreshing portfolio:', error);
//     }
//   };

//   // FIXED: Extract fetchTransactions function
//   const fetchTransactions = useCallback(async () => {
//     try {
//       console.log('Fetching transactions...'); // Debug log
//       const res = await axiosInstance.get('/trade/transactions/');
//       console.log('Transactions response:', res.data); // Debug log
//       setTransactions(res.data.transactions || res.data || []); // Handle different response formats
//     } catch (error) {
//       console.error('Error fetching transactions:', error);
//       setTransactions([]); // Set empty array on error
//     }
//   }, []);

//   const fetchPendingOrders = async () => {
//     try {
//       const res = await axiosInstance.get('/trade/pending_orders/');
//       setPendingOrders(res.data.pending_orders || []);
//     } catch (error) {
//       console.error('Error fetching pending orders:', error);
//     }
//   };

//   useEffect(() => {
//     const fetchWatchlist = async () => {
//       try {
//         const res = await axiosInstance.get('/watchlist/');
//         const watchlistData = res.data;
//         setWatchlist(watchlistData);

//         // Fetch live prices for all symbols in the watchlist
//         const symbols = watchlistData.map(item => item.symbol);
//         if (symbols.length > 0) {
//           const pricesData = {};
//           for (const symbol of symbols) {
//             try {
//               const priceRes = await fetch(`${API_BASE_URL}/${symbol}/`);
//               const priceData = await priceRes.json();

//               const stockInfo = Array.isArray(priceData) ? priceData[0] : priceData;

//               pricesData[symbol] = {
//                 price: parseFloat(stockInfo.price) || 0,
//                 change: parseFloat(stockInfo.change) || 0,
//                 changePercent: parseFloat(stockInfo.changePercent) || 0,
//                 previousClose: parseFloat(stockInfo.previousClose) || 0,
//                 volume: stockInfo.volume || 0,
//                 marketCap: stockInfo.marketCap || 0,
//                 companyName: stockInfo.name || symbol,
//               };

//             } catch (err) {
//               console.error(`Error fetching price for ${symbol}`, err);
//             }
//           }
//           setPrices(pricesData);
//         }

//       } catch (error) {
//         console.error("Error fetching watchlist:", error);
//       }
//     };

//     fetchWatchlist();
//   }, []);

//   // Fetch balance on component mount
//   useEffect(() => {
//     const fetchBalance = async () => {
//       try {
//         const response = await fetch('http://localhost:8000/api/user/cash/');
//         const data = await response.json();
//         setCash(data.default_balance);
//       } catch (error) {
//         setCash(50000);
//       }
//     };

//     fetchBalance();
//   }, []);

//   // Fetch real-time prices for watchlist
//   const fetchPrices = async (watchlistArr) => {
//     if (!watchlistArr || watchlistArr.length === 0) return;
//     const symbols = watchlistArr.map(item => item.symbol);

//     try {
//       const symbolsParam = symbols.join(',');
//       const response = await fetch(`${API_BASE_URL}/quotes?symbols=${symbolsParam}`);
//       const data = await response.json();

//       if (data.success && data.quotes) {
//         const newPrices = {};
//         data.quotes.forEach(quote => {
//           newPrices[quote.symbol] = {
//             price: parseFloat(quote.regularMarketPrice) || 0,
//             change: parseFloat(quote.regularMarketChange) || 0,
//             changePercent: parseFloat(quote.regularMarketChangePercent) || 0,
//             previousClose: parseFloat(quote.previousClose) || 0,
//             volume: quote.volume || 0,
//             marketCap: quote.marketCap || 0,
//             companyName: quote.longName || quote.shortName || quote.symbol
//           };
//         });

//         setPrices(prevPrices => ({
//           ...prevPrices,
//           ...newPrices
//         }));
//       }
//     } catch (error) {
//       console.error('Error fetching prices:', error);
//     }
//   };

//   //fetch market status
//   useEffect(() => {
//     const fetchMarketStatus = async () => {
//       try {
//         const response = await fetch('http://localhost:8000/api/market-status/');
//         const data = await response.json();

//         console.log("Market status data:", data);

//         if (data && typeof data.is_open === 'boolean') {
//           setMarketStatusData(data);
//         } else {
//           throw new Error('Unexpected market status response');
//         }
//       } catch (error) {
//         console.error('Failed to fetch market status:', error);
//         setMarketStatusData({ message: 'Unknown', is_open: null });
//       }
//     };

//     fetchMarketStatus();
//   }, []);

//   const removeFromWatchlist = async (symbol) => {
//     try {
//       await axiosInstance.delete(`/watchlist/remove/?symbol=${symbol}`);
//       setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
//       const newPrices = { ...prices };
//       delete newPrices[symbol];
//       setPrices(newPrices);
//     } catch (error) {
//       console.error("Error deleting from watchlist:", error);
//       alert("Failed to delete from watchlist");
//     }
//   };

//   // Initial load and periodic updates for watchlist
//   useEffect(() => {
//     if (watchlist.length > 0) {
//       fetchPrices(watchlist);

//       // Update prices every 30 seconds
//       const interval = setInterval(() => {
//         fetchPrices(watchlist);
//       }, 30000);

//       return () => clearInterval(interval);
//     }
//   }, [watchlist]);

//   // Set default selected stock
//   useEffect(() => {
//     if (!selectedStock && watchlist.length > 0) {
//       setSelectedStock(watchlist[0].symbol);
//     }
//   }, [watchlist, selectedStock]);

//   // Add this useEffect to handle body scroll locking
// useEffect(() => {
//   if (showTradePanel) {
//     // Prevent body scroll when modal is open
//     document.body.style.overflow = 'hidden';
//     document.body.style.position = 'fixed';
//     document.body.style.width = '100%';
//   } else {
//     // Restore body scroll when modal is closed
//     document.body.style.overflow = '';
//     document.body.style.position = '';
//     document.body.style.width = '';
//   }

//   // Cleanup function to restore scroll when component unmounts
//   return () => {
//     document.body.style.overflow = '';
//     document.body.style.position = '';
//     document.body.style.width = '';
//   };
// }, [showTradePanel]);

//   // FIXED: Updated buyStock function
// //   const buyStock = useCallback(async () => {
// //   const stockData = prices[selectedStock];
// //   if (!stockData || stockData.price <= 0) {
// //     alert('Stock data not available or invalid price');
// //     return;
// //   }

// //   const currentPrice = stockData.price;

// //   if (orderType === 'limit' && limitPrice && currentPrice > parseFloat(limitPrice)) {
// //     alert('Limit price not met for buy order');
// //     return;
// //   }

// //   try {
// //     const response = await axiosInstance.post('/trade/buy/', {
// //       symbol: selectedStock,
// //       quantity,
// //       order_type: orderType.toUpperCase(),
// //       limit_price: orderType === 'limit' ? limitPrice : undefined,
// //     });

// //     setSuccessMessage('Stock bought successfully');
// //     setTimeout(() => setSuccessMessage(''), 5000);

// //     await refreshPortfolio();
// //     await fetchPendingOrders();
// //     await fetchTransactions();

// //     setQuantity(1);
// //     setLimitPrice('');
// //   } catch (error) {
// //     console.error('Buy failed:', error);
// //     alert(error.response?.data?.error || 'Failed to buy stock');
// //   }
// // }, [selectedStock, quantity, prices, orderType, limitPrice, fetchTransactions]);


// const buyStock = useCallback(async () => {
//   const stockData = prices[selectedStock];
//   if (!stockData || stockData.price <= 0) {
//     alert('Stock data not available or invalid price');
//     return;
//   }

//   const currentPrice = stockData.price;
//   const quantity = getCurrentQuantity(); 

//   try {
//     if (orderType === 'limit') {
//       if (!limitPrice || parseFloat(limitPrice) <= 0) {
//         alert('Please enter a valid limit price');
//         return;
//       }

//       const parsedLimit = parseFloat(limitPrice);

//       if (currentPrice > parsedLimit) {
//         console.log(`BUY limit order queued: ${currentPrice} > ${parsedLimit}`);
//         const response = await axiosInstance.post('/trade/buy/', {
//           symbol: selectedStock,
//           quantity,
//           order_type: 'LIMIT',
//           limit_price: parsedLimit,
//         });

//         setSuccessMessage('Buy limit order placed and pending execution');
//         setTimeout(() => setSuccessMessage(''), 5000);
//         await refreshPortfolio();
//         await fetchPendingOrders();
//         return;
//       }
//     }

//     // Market or executable limit
//     const response = await axiosInstance.post('/trade/buy/', {
//       symbol: selectedStock,
//       quantity,
//       order_type: orderType.toUpperCase(),
//       limit_price: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
//     });

//     setSuccessMessage(response.data.message || 'Buy order placed');
//     setTimeout(() => setSuccessMessage(''), 5000);
//     await refreshPortfolio();
//     await fetchPendingOrders();
//   } catch (error) {
//     console.error('Buy failed:', error);
//     alert(error.response?.data?.error || 'Failed to buy stock');
//   } finally {
//     setMarketQuantity(1);
//     setLimitQuantity(1);
//     setLimitPrice('');
//   }
// }, [selectedStock, marketQuantity, limitQuantity, prices, orderType, limitPrice, getCurrentQuantity]);



// // CORRECTED sellStock function
// const sellStock = useCallback(async () => {
//   const stockData = prices[selectedStock];
//   if (!stockData || stockData.price <= 0) {
//     alert('Stock data not available or invalid price');
//     return;
//   }

//   const currentPrice = stockData.price;
//   const quantity = getCurrentQuantity(); 

//   try {
//     if (orderType === 'limit') {
//       if (!limitPrice || parseFloat(limitPrice) <= 0) {
//         alert('Please enter a valid limit price');
//         return;
//       }

//       const parsedLimit = parseFloat(limitPrice);

//       // 🚫 Price is too low — queue the order
//       if (currentPrice < parsedLimit) {
//         console.log(`SELL limit order queued: ${currentPrice} < ${parsedLimit}`);
//         const response = await axiosInstance.post('/trade/sell/', {
//           symbol: selectedStock,
//           quantity,
//           order_type: 'LIMIT',
//           limit_price: parsedLimit,
//         });

//         setSuccessMessage('Sell limit order placed and pending execution');
//         setTimeout(() => setSuccessMessage(''), 5000);
//         await refreshPortfolio();
//         await fetchPendingOrders();
//         return;
//       }
//     }

//     // Market or executable limit
//     const response = await axiosInstance.post('/trade/sell/', {
//       symbol: selectedStock,
//       quantity,
//       order_type: orderType.toUpperCase(),
//       limit_price: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
//     });

//     setSuccessMessage(response.data.message || 'Sell order placed');
//     setTimeout(() => setSuccessMessage(''), 5000);
//     await refreshPortfolio();
//     await fetchPendingOrders();
//   } catch (error) {
//     console.error('Sell failed:', error);
//     alert(error.response?.data?.error || 'Failed to sell stock');
//   } finally {
//     setMarketQuantity(1);
//     setLimitQuantity(1);
//     setLimitPrice('');
//   }
// }, [selectedStock, marketQuantity, limitQuantity, prices, orderType, limitPrice, getCurrentQuantity]);


//   // Fetch portfolio data
//   useEffect(() => {
//     const fetchPortfolio = async () => {
//       try {
//         const res = await axiosInstance.get('/trade/portfolio_information/');
//         setPortfolio(res.data.portfolio_snapshot || {});
//         setCash(res.data.cash || 0);
//       } catch (error) {
//         console.error('Error fetching portfolio:', error);
//       }
//     };

//     fetchPortfolio();
//   }, []);

//   // FIXED: Fetch transactions on component mount
//   useEffect(() => {
//     fetchTransactions();
//   }, [fetchTransactions]);

//   // Initial load
//   useEffect(() => {
//     fetchPendingOrders();
//   }, []);

//   // FIXED: Updated sellStock function
//   // const sellStock = useCallback(async () => {
//   // const stockData = prices[selectedStock];
//   // if (!stockData || stockData.price <= 0) {
//   //   setSuccessMessage('Stock data not available or invalid price');
//   //   setTimeout(() => setSuccessMessage(''), 5000);
//   //   return;
//   // }

//   // const currentPrice = stockData.price;

//   // Optional pre-check for limit sell: current price should not be less than limit
// //   if (orderType === 'limit' && limitPrice && currentPrice < parseFloat(limitPrice)) {
// //     setSuccessMessage('Limit price not met for sell order');
// //     setTimeout(() => setSuccessMessage(''), 5000);
// //     return;
// //   }

// //   try {
// //     const response = await axiosInstance.post('/trade/sell/', {
// //       symbol: selectedStock,
// //       quantity,
// //       order_type: orderType.toUpperCase(),
// //       limit_price: orderType === 'limit' ? limitPrice : undefined,
// //     });

// //     setSuccessMessage('Stock sold successfully');
// //     setTimeout(() => setSuccessMessage(''), 5000);

// //     await refreshPortfolio();
// //     await fetchPendingOrders();
// //     await fetchTransactions();

// //     setQuantity(1);
// //     setLimitPrice('');
// //   } catch (error) {
// //     console.error('Sell failed:', error);
// //     const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to sell stock';
// //     setSuccessMessage(errorMessage);
// //     setTimeout(() => setSuccessMessage(''), 5000);
// //   }
// // }, [selectedStock, quantity, prices, orderType, limitPrice, fetchTransactions]);


//   useEffect(() => {
//     const interval = setInterval(() => {
//       refreshPortfolio();
//       fetchTransactions(); // Also refresh transactions periodically
//     }, 15000); // every 15 seconds

//     return () => clearInterval(interval);
//   }, [fetchTransactions]);

//   //  const isTradingDisabled = () => {
//   //     return marketStatusData?.is_open === false || 
//   //            !selectedStock || 
//   //            !prices[selectedStock] || 
//   //            prices[selectedStock].price <= 0;
//   //   };

//       return (
//               <div className="min-h-screen bg-slate-900 text-white">
//                 {/* Header */}
//                 <header className="bg-slate-800 border-b border-slate-700 fixed top-0 w-full z-50">
//                   <div className="max-w-7xl mx-auto px-6 py-4">
//                     <div className="flex justify-between items-center">
//                       <div className="flex items-center space-x-2">
//                         <img src={logo} alt="Logo" className="w-8 h-8" />
//                         <span className="text-xl font-semibold">EducateTrade</span>
//                       </div>
//                       <nav className="flex items-center space-x-16 text-xl">
//                         <button
//                           onClick={() => navigate('/portfolio')}
//                           className={`font-semibold ${
//                             isActive('/portfolio') ? 'text-white' : 'text-blue-400 hover:text-blue-300'
//                           }`}
//                       >
//                         Portfolio
//                       </button>

//                       <button
//                         onClick={() => navigate('/trade')}
//                         className={`font-semibold ${
//                           isActive('/trade') ? 'text-white' : 'text-blue-400 hover:text-blue-300'
//                           }`}
//                       >
//                         Trade
//                       </button>

//                       <button
//                         onClick={() => navigate('/research')}
//                         className={`font-semibold ${
//                           isActive('/research') ? 'text-white' : 'text-blue-400 hover:text-blue-300'        
//                           }`}
//                       >
//                         Research
//                       </button>
//                       <button
//                         onClick={() => navigate('/orders')}
//                         className={`font-semibold ${
//                           isActive('/orders') ? 'text-white' : 'text-blue-400 hover:text-blue-300'
//                         }`}
//                       >
//                         Orders
//                       </button>
//                     </nav>
//                     <div className="flex items-center space-x-4">
//                       <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
//                         £{cash.toFixed(2)}
//                       </div>
//                       <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium">
//                         LOGOUT
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </header>

//              {/* Content */}
//             <div className="max-w-7xl mx-auto p-6 min-h-screen">
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-20">

//                {/* Left Column - Search and Market Prices (moved up) */}
//               <div className="lg:col-span-2">
//                 {watchlistMessage && (
//                   <div className="flex items-center gap-2 p-3 bg-green-900/10 border-l-4 border-green-500 font-anton text-green-400 text-xl mt-6 mb-2 rounded">
//                   <span>✅</span>   
//                     {watchlistMessage}
//                   </div>
//                 )}

//             {/* Search Section */}
//             <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
//               <h2 className="text-xl font-bold mb-4">Search & Add Stocks</h2>
//               <div className="space-y-4">
//                 <div className="relative w-full">
//                   <div className="flex gap-2 items-center">
//                     {/* Input with spinner inside */}
//                     <div className="relative w-full" ref={inputRef}>
//                         <input
//                           type="text"
//                           placeholder="Enter stock symbol (e.g. AAPL)"
//                           className="w-full p-3 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 pr-10"
//                           value={lookupSymbol}
//                           onChange={e => {
//                             const value = e.target.value.toUpperCase();
//                             setLookupSymbol(value);
//                             fetchSuggestions(value);
//                           }}
//                           onFocus={() => setShowSuggestions(true)}
//                         />

//                       {/* Loading Spinner */}
//                       {symbolFetching && (
//                         <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
//                           <div className="w-4 h-4 border-2 border-white border-t-blue-500 rounded-full animate-spin"></div>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Suggestions Dropdown */}
//                   {showSuggestions && lookupSymbol && (
//                     <ul className="absolute bg-gray-700 text-white border border-gray-400 rounded w-full z-10 max-h-60 overflow-y-auto mt-1">
//                   {suggestions.length === 1 && suggestions[0].error ? (
//                     <li className="px-4 py-2 text-red-500 cursor-default">
//                       {suggestions[0].error}
//                     </li>
//                   ) : (
//                     suggestions.map((item) => (
//                       <li
//                         key={item.symbol}
//                         onClick={() => {
//                           setLookupSymbol("");
//                           setShowSuggestions(false);
//                           setLookupResult(item);
//                         }}
//                         className="px-4 py-2 hover:bg-gray-600 cursor-pointer"
//                       >
//                         <div className="flex items-center space-x-16">
//                           <span className="font-bold w-20">{item.symbol}</span>
//                           {item.name && <span className="text-white">{item.name.replaceAll('"', '')}</span>}
//                         </div>
//                       </li>
//                     ))
//                   )}
//                 </ul>
//                   )}
//                 </div>

//                 {lookupError && (
//                   <div className="text-red-400 p-3 bg-red-900/20 rounded border border-red-500">
//                     {lookupError}
//                   </div>
//                 )}

//                 {lookupResult && (
//                   <div className="bg-gray-700 p-4 rounded border border-gray-600">
//                     <div className="flex justify-between items-start">
//                       <div className="flex-1">
//                         <div className="flex items-center gap-3 mb-2">
//                           <h3 className="text-lg font-bold text-blue-400">
//                             {lookupResult.symbol}
//                           </h3>
//                           <span className="text-gray-300">-</span>
//                           <span className="text-gray-300">{lookupResult.name}</span>
//                         </div>

//                         <div className="grid grid-cols-2 gap-4 text-sm">
//                           <div>
//                             <span className="text-gray-400">Price:</span>
//                             <span className="ml-2 font-semibold">£{parseFloat(lookupResult.price || 0).toFixed(2)}</span>
//                           </div>
//                           <div>
//                             <span className="text-gray-400">Currency:</span>
//                             <span className="ml-2">{lookupResult.currency || 'USD'}</span>
//                           </div>
//                           <div>
//                             <span className="text-gray-400">Change:</span>
//                             <span className={`ml-2 ${parseFloat(lookupResult.change) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
//                               {parseFloat(lookupResult.change || 0) >= 0 ? '+' : ''}£{parseFloat(lookupResult.change || 0).toFixed(2)}
//                             </span>
//                           </div>
//                           <div>
//                             <span className="text-gray-400">Change %:</span>
//                             <span className={`ml-2 ${parseFloat(lookupResult.changePercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
//                               {parseFloat(lookupResult.changePercent || 0) >= 0 ? '+' : ''}{parseFloat(lookupResult.changePercent || 0).toFixed(2)}%
//                             </span>
//                           </div>
//                         </div>
//                       </div>

//                       <button
//                         onClick={addSearchedStockToWatchlist}
//                         disabled={watchlist.length >= 5}
//                         className={`px-4 py-2 rounded ${watchlist.length >= 5 ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
//                           }`}
//                       >
//                         Add to Watchlist
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Watchlist */}
//             <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
//               <h2 className="text-xl font-bold mb-4">Market Prices ({watchlist.length} stocks)</h2>
//               {watchlist.length === 0 ? (
//                 <div className="text-center py-12">
//                   <div className="text-gray-400 text-lg mb-2">📈</div>
//                   <p className="text-gray-400 mb-2">No stocks in your watchlist yet</p>
//                   <p className="text-gray-500 text-sm">Search for stocks above and add them to your watchlist to see live prices</p>
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {watchlist.map((item) => {
//                     const symbol = item.symbol;
//                     const stockData = prices[symbol];
//                     if (!stockData) {
//                       return (
//                         <div key={symbol} className="p-4 rounded border border-gray-600 animate-pulse">
//                           <div className="flex justify-between items-center">
//                             <div>
//                               <p className="font-bold text-lg">{symbol}</p>
//                               <p className="text-xs text-gray-400">Loading...</p>
//                             </div>
//                             <div className="text-gray-400">Loading prices...</div>
//                           </div>
//                         </div>
//                       );
//                     }

//                     const isPositive = stockData.changePercent >= 0;
//                     const priceChangeIcon = isPositive ? '↑' : '↓';

//                     return (
//                       <div
//                         key={symbol}
//                         className={`relative p-4 rounded border cursor-pointer transition-all hover:shadow-lg ${selectedStock === symbol
//                           ? 'border-blue-500 bg-blue-900/20 shadow-blue-500/20'
//                           : 'border-gray-600 hover:border-gray-500'
//                           }`}
//                         onClick={() => setSelectedStock(symbol)}
//                       >
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             removeFromWatchlist(item.symbol);
//                           }}
//                           className="absolute top-0 right-3.5 text-red-400 hover:text-red-300 text-sm"
//                           title="Remove from watchlist"
//                         >
//                           ✕
//                         </button>
//                         <div className="flex justify-between items-center">
//                           <div className="flex-1">
//                             <div className="flex items-center gap-2 mb-1">
//                               <p className="font-bold text-lg">{symbol}</p>
//                               <span className={`text-sm leading-none ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
//                                 {priceChangeIcon}
//                               </span>
//                             </div>
//                             <p className="text-xs text-gray-400 mb-2 truncate" title={stockData.companyName}>
//                               {stockData.companyName}
//                             </p>
//                             <p className="text-2xl font-bold">£{stockData.price.toFixed(2)}</p>
//                           </div>
//                           <div className="text-right">
//                             <p className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
//                               {isPositive ? '+' : ''}£{stockData.change.toFixed(2)}
//                             </p>
//                             <p className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
//                               {isPositive ? '+' : ''}{stockData.changePercent.toFixed(2)}%
//                             </p>
//                             <div className="text-gray-400 text-xs mt-1">
//                               Owned: {portfolio[symbol] || 0}

//                           <div className="mt-2 flex justify-end gap-2">
//                               <button
//                                       onClick={(e) => {
//                                       e.stopPropagation();
//                                       setTradeType("Buy");
//                                       setSelectedStock(symbol);
//                                       setShowTradePanel(true);
//                                       }}
//                                       className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded"
//                                   >
//                                       Trade
//                               </button>
//                               {/* <button
//                                       onClick={(e) => {
//                                   e.stopPropagation();
//                                   setTradeType("Sell");
//                                   setSelectedStock(symbol);
//                                   setShowTradePanel(true);
//                                   }}
//                                     className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded"
//                                   >
//                                       Sell
//                               </button> */}
//                               </div>                         
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Right Column - Market Status and Trading Panel */}
//           <div className="space-y-6">
//             {/* Market Status */}
//             <div>
//               <SummaryCard
//                 label="Market Status"
//                 value={
//                   <>
//                     <div>{marketStatusData?.message || 'Loading...'}</div>
//                     {marketStatusData?.is_open === true && (
//                       <div className="text-xs text-gray-400 mt-6">
//                         Closes at <span className="font-medium">{marketStatusData.market_close}</span> ({marketStatusData.timezone})
//                       </div>
//                     )}
//                     {marketStatusData?.is_open === false && (
//                       <div className="text-xs text-gray-400 mt-0.5">
//                         Opens at <span className="font-medium">{marketStatusData.market_open}</span> ({marketStatusData.timezone})
//                       </div>
//                     )}
//                   </>
//                 }
//                 icon={
//                   marketStatusData?.is_open ? '🟢' :
//                   marketStatusData?.is_open === false ? '🔴' : '⏳'
//                 }
//                 color={
//                   marketStatusData?.is_open ? 'text-green-400' :
//                   marketStatusData?.is_open === false ? 'text-red-400' : 'text-yellow-400'
//                 }
//               />
//             </div>
//             {/* Compact Trading Panel */}
//               {showTradePanel && (
//                 <div className="bg-black bg-opacity-60 flex justify-center items-center"
//                   style={{position: 'fixed',top: 0,left: 0,right: 0,bottom: 0,width: '100vw',height: '100vh',margin: 0,padding: 0,zIndex: 9999,backgroundColor: 'rgba(0, 0, 0, 0.6)'
//                   }}
//                     onClick={(e) => {
//                       // Close modal when clicking on backdrop
//                       if (e.target === e.currentTarget) {
//                         setShowTradePanel(false);
//                       }
//                     }}
//                   >
//                     <div 
//                       className="bg-gray-800 p-2 pt-2 rounded-lg border border-gray-700 w-[70vw] max-w-sm max-h-[95vh] shadow-2xl overflow-hidden relative"
//                       onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
//                     >

//                       <button
//                         onClick={() => setShowTradePanel(false)}
//                         className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl z-10"
//                       >
//                         &times;
//                       </button>

//                       <div className="p-1 space-y-1 overflow-y-auto ">
//                       <h2 className="text-lg font-bold mb-1">Place Order</h2>

//                       {/* {successMessage && (
//                         <p className="text-green-400 text-xs mb-2">{successMessage}</p>
//                       )} */}

//                       {/* Stock Selection - Compact */}
//                       <div>
//                         <label className="block text-xs font-medium mb-1 text-gray-300">Stock</label>
//                         {selectedStock && prices[selectedStock] ? (
//                           <div className="p-2 bg-gray-700 border border-gray-600 rounded text-sm">
//                             <div className="flex justify-between items-center">
//                               <span className="font-medium">{selectedStock}</span>
//                               <span className="text-green-400">£{prices[selectedStock].price.toFixed(2)}</span>
//                             </div>
//                             <div className="text-xs text-gray-400 truncate">
//                               {prices[selectedStock].companyName}
//                             </div>
//                           </div>
//                         ) : (
//                           <select
//                             value={selectedStock || ''}
//                             onChange={e => setSelectedStock(e.target.value)}
//                             className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none text-sm"
//                           >
//                             <option value="">Select stock...</option>
//                             {watchlist
//                               .filter(item => prices[item.symbol] && prices[item.symbol].price > 0)
//                               .map(item => (
//                                 <option key={item.symbol} value={item.symbol}>
//                                   {item.symbol} - £{prices[item.symbol].price.toFixed(2)}
//                                 </option>
//                               ))
//                             }
//                           </select>
//                         )}
//                       </div>

//                       {/* Order Type - Compact */}
//                       <div>
//                         <label className="block text-xs font-medium mb-1 text-gray-300">Type</label>
//                         <div className="grid grid-cols-2 gap-2">
//                           <button
//                             onClick={() => setOrderType('market')}
//                             className={`p-2 rounded border text-xs transition-all ${
//                               orderType === 'market'
//                                 ? 'border-blue-500 bg-blue-900/30 text-blue-400'
//                                 : 'border-gray-600 bg-gray-700 hover:border-gray-500'
//                             }`}
//                           >
//                             <div className="flex items-center justify-center gap-1">
//                               <span>⚡</span>
//                               <span>Market</span>
//                             </div>
//                           </button>

//                           <button
//                             onClick={() => setOrderType('limit')}
//                             className={`p-2 rounded border text-xs transition-all ${
//                               orderType === 'limit'
//                                 ? 'border-yellow-500 bg-yellow-900/30 text-yellow-400'
//                                 : 'border-gray-600 bg-gray-700 hover:border-gray-500'
//                             }`}
//                           >
//                             <div className="flex items-center justify-center gap-1">
//                               <span>🎯</span>
//                               <span>Limit</span>
//                             </div>
//                           </button>
//                         </div>
//                       </div>

//                       {/* Quantity and Limit Price - Side by Side */}
//                       <div className="grid grid-cols-2 gap-2">
//                         {/* Quantity */}
//                         {orderType === 'market' ? (
//   // Market Order Quantity Input
//   <div className="mb-4">
//     <label className="block text-sm font-medium text-gray-300 mb-1">
//       Market Order Quantity
//     </label>
//     <input
//       type="number"
//       value={marketQuantity === 0 ? '' : marketQuantity}
//       onChange={e => {
//         const value = e.target.value;
//         if (value === '') {
//           setMarketQuantity(0);
//         } else if (/^\d+$/.test(value)) {
//           setMarketQuantity(Number(value));
//         }
//       }}
//       placeholder="0"
//       min="1"
//       className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none text-sm"
//     />
//   </div>
// ) : (
//   // Limit Order Quantity Input
//   <div className="mb-4">
//     <label className="block text-sm font-medium text-gray-300 mb-1">
//       Limit Order Quantity
//     </label>
//     <input
//       type="number"
//       value={limitQuantity === 0 ? '' : limitQuantity}
//       onChange={e => {
//         const value = e.target.value;
//         if (value === '') {
//           setLimitQuantity(0);
//         } else if (/^\d+$/.test(value)) {
//           setLimitQuantity(Number(value));
//         }
//       }}
//       placeholder="0"
//       min="1"
//       className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none text-sm"
//     />
//   </div>
// )}


//                         {/* Limit Price - Only show for limit orders */}
//                         {orderType === 'limit' && selectedStock && prices[selectedStock] ? (
//                           <div>
//                             <label className="block text-xs font-medium mb-1 text-gray-300">
//                               Limit Price
//                             </label>
//                             <div className="relative">
//                               <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">£</span>
//                               <input
//                                 type="number"
//                                 value={limitPrice}
//                                 onChange={e => setLimitPrice(e.target.value)}
//                                 className="w-full pl-6 pr-2 py-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none text-sm"
//                                 step="0.01"
//                                 min="0.01"
//                                 placeholder={prices[selectedStock].price.toFixed(2)}
//                               />
//                             </div>
//                           </div>
//                         ) : (
//                           <div></div>
//                         )}
//                       </div>

//                       {/* Quick Price Buttons - Only for limit orders */}
//                       {orderType === 'limit' && selectedStock && prices[selectedStock] && (
//                         <div>
//                           {/* <p className="text-xs text-gray-400 mb-1">
//                             Current: £{prices[selectedStock].price.toFixed(2)}
//                           </p> */}
//                           <div className="flex gap-1 justify-between">
//                             {[
//                               { label: '-2%', value: (prices[selectedStock].price * 0.98).toFixed(2) },
//                               { label: '-1%', value: (prices[selectedStock].price * 0.99).toFixed(2) },
//                               { label: 'Mkt', value: prices[selectedStock].price.toFixed(2) },
//                               { label: '+1%', value: (prices[selectedStock].price * 1.01).toFixed(2) },
//                               { label: '+2%', value: (prices[selectedStock].price * 1.02).toFixed(2) },
//                             ].map((suggestion) => (
//                               <button
//                                 key={suggestion.label}
//                                 onClick={() => setLimitPrice(suggestion.value)}
//                                 className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 text-gray-300 flex-1"
//                               >
//                                 {suggestion.label}
//                               </button>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* Order Summary - Compact */}
//                       {selectedStock && prices[selectedStock] && prices[selectedStock].price > 0 && (
//                         <div className="bg-gray-700 p-1 rounded border border-gray-600">
//                           <h3 className="font-medium mb-2 text-sm">Summary</h3>
//                           <div className="space-y-1 text-xs">
//                             <div className="flex justify-between">
//                               <span className="text-gray-400">Stock:</span>
//                               <span>{selectedStock}</span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span className="text-gray-400">Type:</span>
//                               <span className="capitalize">{orderType}</span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span className="text-gray-400">Qty:</span>
//                               <span>{quantity} shares</span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span className="text-gray-400">Price:</span>
//                               <span>
//                                 {orderType === 'market' 
//                                   ? `£${prices[selectedStock].price.toFixed(2)}` 
//                                   : limitPrice 
//                                     ? `£${parseFloat(limitPrice).toFixed(2)}`
//                                     : 'Not set'
//                                 }
//                               </span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span className="text-gray-400">Cash:</span>
//                               <span className="text-green-400">£{cash.toFixed(2)}</span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span className="text-gray-400">Owned:</span>
//                               <span className="text-blue-400">{portfolio[selectedStock] || 0}</span>
//                             </div>
//                             <div className="flex justify-between font-medium pt-1 border-t border-gray-600">
//                               <span className="text-gray-400">Total:</span>
//                               <span>
//                                 £{(orderType === 'market' 
//                                   ? prices[selectedStock].price * quantity 
//                                   : limitPrice 
//                                     ? parseFloat(limitPrice) * quantity 
//                                     : 0
//                                 ).toFixed(2)}
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                       )}

//                       {/* Order Type Info - Compact */}
//                       {/* {selectedStock && prices[selectedStock] && (
//                         <div className={`rounded p-2 text-xs ${
//                           orderType === 'market' 
//                             ? 'bg-blue-900/20 border border-blue-500/30' 
//                             : 'bg-yellow-900/20 border border-yellow-500/30'
//                         }`}> */}
//                           {/* <div className="flex items-center gap-1 mb-1">
//                             <span>{orderType === 'market' ? '⚡' : '🎯'}</span>
//                             <span className={`font-medium ${orderType === 'market' ? 'text-blue-400' : 'text-yellow-400'}`}>
//                               {orderType === 'market' ? 'Market Order' : 'Limit Order'}
//                             </span>
//                           </div> */}
//                           {/* <p className="text-gray-300">
//                             {orderType === 'market' 
//                               ? `Executes immediately at ~£${prices[selectedStock].price.toFixed(2)}`
//                               : 'Executes only when price reaches your limit'
//                             }
//                           </p> */}

//                           {/* Limit Price Analysis - Ultra Compact */}
//                           {/* {orderType === 'limit' && limitPrice && !isNaN(parseFloat(limitPrice)) && (
//                             <div className="mt-2 bg-gray-800 rounded p-2">
//                               {(() => {
//                                 const priceDiff = ((parseFloat(limitPrice) - prices[selectedStock].price) / prices[selectedStock].price * 100);
//                                 if (Math.abs(priceDiff) > 2) {
//                                   return (
//                                     <div className={`${priceDiff > 0 ? 'text-red-400' : 'text-yellow-400'}`}>
//                                       {priceDiff > 0 ? '⚠️' : '📊'} {Math.abs(priceDiff).toFixed(1)}% {priceDiff > 0 ? 'above' : 'below'} market
//                                     </div>
//                                   );
//                                 } 
//                               })()}
//                             </div>
//                           )}
//                         </div>
//                       )} */}
//                       {successMessage && (
//                         <div
//                             className={`flex items-center gap-1 p-1 mt-1 mb-1 rounded-md font-inter text-xs ${
//                             tradeType === "Buy"
//                                 ? "bg-blue-100 text-green-800 border border-green-300"
//                                 : "bg-blue-100 text-red-800 border border-red-300"
//                             }`}
//                         >
//                             <span>{tradeType === "Buy" ? "" : ""}</span>
//                             <span>{successMessage}</span>
//                         </div>
//                         )}

//                       {/* Action Buttons - Compact */}
//                       <div className="flex gap-2 pt-1">
//                         <button
//                           onClick={buyStock}
//                           disabled={!selectedStock || !prices[selectedStock] || prices[selectedStock].price <= 0}
//                           className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded font-bold transition-colors text-sm"
//                         >
//                           BUY
//                         </button>
//                         <button
//                           onClick={sellStock}
//                           disabled={!selectedStock || !prices[selectedStock] || prices[selectedStock].price <= 0}
//                           className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded font-bold transition-colors text-sm"
//                         >
//                           SELL
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Transactions */}
//               <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
//                 <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
//                 <div className="space-y-2 max-h-64 overflow-y-auto">
//                   {transactions.length === 0 ? (
//                     <p className="text-gray-400 text-center py-4">No transactions yet</p>
//                   ) : (
//                     transactions.map(transaction => (
//                       <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
//                         <div className="flex items-center gap-3">
//                           <span
//                             className={`px-2 py-1 rounded text-xs font-bold ${
//                               transaction.type === 'BUY' ? 'bg-green-600' : 'bg-red-600'
//                             }`}
//                           >
//                             {transaction.type}
//                           </span>
//                           <span className="font-medium">{transaction.symbol}</span>
//                           <span className="text-gray-400">×{transaction.quantity}</span>
//                           <span className="text-gray-400">@£{transaction.price.toFixed(2)}</span>
//                         </div>
//                         <div className="text-right text-sm">
//                           <div className="font-medium">£{transaction.total.toFixed(2)}</div>
//                           <div className="text-gray-400 text-xs">{transaction.timestamp}</div>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>
//                   {/* Pending Orders Section */}
//                 {/* <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mt-8">
//                   <h2 className="text-xl font-bold mb-4">Pending Orders</h2>
//                   <div className="space-y-2 max-h-64 overflow-y-auto">
//                     {pendingOrders.length === 0 ? (
//                       <p className="text-gray-400 text-center py-4">No pending orders</p>
//                     ) : (
//                       pendingOrders.map((order, index) => (
//                         <div key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
//                           <div className="flex items-center gap-3">
//                             <span
//                               className={`px-2 py-1 rounded text-xs font-bold ${
//                                 order.type === 'BUY' ? 'bg-green-600' : 'bg-red-600'
//                               }`}
//                             >
//                               {order.type}
//                             </span>
//                             <span className="font-medium">{order.symbol}</span>
//                             <span className="text-gray-400">×{order.quantity}</span>
//                             <span className="text-gray-400">@£{order.price.toFixed(2)}</span>
//                           </div>
//                           <div className="text-right text-sm">
//                             <div className="text-gray-400 text-xs">{order.created_at}</div>
//                           </div>
//                         </div>
//                       ))
//                     )}
//                   </div> */}
//                 </div>
//             </div>
//           </div>
//         </div>
//       // </div>
//     );
//   };

//   // Helper Components
//   const SummaryCard = ({ label, value, icon, color }) => (
//     <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
//       <div className="flex justify-between items-center">
//         <div>
//           <p className="text-gray-400 text-sm">{label}</p>
//           <p className={`text-2xl font-bold ${color}`}>{value}</p>
//         </div>
//         <div className={`text-2xl ${color}`}>{icon}</div>
//       </div>
//     </div>
//   );

//   const Dropdown = ({ label, value, onChange, options }) => (
//     <div>
//       <label className="block text-sm font-medium mb-2">{label}</label>
//       <select
//         value={value}
//         onChange={onChange}
//         className="w-full p-3 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
//       >
//         <option value="">Select {label}</option>
//         {options.map(opt => (
//           <option key={opt} value={opt}>
//             {typeof opt === 'string' ? opt.toUpperCase() : opt}
//           </option>
//         ))}
//       </select>
//     </div>
//   );

//   const InputField = ({ label, value, onChange, ...props }) => (
//     <div>
//       <label className="block text-sm font-medium mb-2">{label}</label>
//       <input
//         {...props}
//         value={value}
//         onChange={onChange}
//         className="w-full p-3 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
//       />
//     </div>
//   );

//   export default Trade;

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from './utils/axiosInstance';
import logo from './assets/tradelogo.png';
import { useClickOutside } from "./hooks/useClickOutside";
import { useTheme } from './components/ThemeProvider';
import { FaSun, FaMoon } from "react-icons/fa";
import { UserCircleIcon, XMarkIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Trade = () => {
  // State variables
  const [cash, setCash] = useState(0);
  const [portfolio, setPortfolio] = useState({});
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [tradeType, setTradeType] = useState("");
  const [prices, setPrices] = useState({});
  const [selectedStock, setSelectedStock] = useState('');

  // Separate quantity states for market and limit orders
  const [marketQuantity, setMarketQuantity] = useState(0);
  const [limitQuantity, setLimitQuantity] = useState(0);

  const [orderType, setOrderType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const navigate = useNavigate();
  const [lookupSymbol, setLookupSymbol] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [marketStatusData, setMarketStatusData] = useState(null);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  // Optimized search states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [symbolFetching, setSymbolFetching] = useState(false);
  const inputRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [watchlistMessage, setWatchlistMessage] = useState('');
  const searchCacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);
  const [firstName, setFirstName] = useState('');
  const [showProfileSidePanel, setShowProfileSidePanel] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Theme hook
  const { isDark, setIsDark } = useTheme();

  // Enhanced theme styles object for better consistency
  const themeStyles = useMemo(() => ({
    // Background styles
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-gray-50',
      secondary: isDark ? 'bg-gray-800' : 'bg-white',
      tertiary: isDark ? 'bg-gray-700' : 'bg-gray-50',
      quaternary: isDark ? 'bg-gray-600' : 'bg-gray-100',
      modal: isDark ? 'bg-gray-800' : 'bg-white',
    },
    // Text styles
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-700',
      tertiary: isDark ? 'text-gray-400' : 'text-gray-500',
      quaternary: isDark ? 'text-gray-500' : 'text-gray-400',
      white: isDark ? 'text-white' : 'text-white',
    },
    // Border styles
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
      secondary: isDark ? 'border-gray-600' : 'border-gray-300',
      tertiary: isDark ? 'border-gray-500' : 'border-gray-400',
    },
    // Button styles
    button: {
      primary: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700',
      secondary: isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200',
      success: isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700',
      danger: isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700',
      disabled: isDark ? 'bg-gray-600' : 'bg-gray-400',
    },
    // Input styles
    input: {
      base: isDark
        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
      focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500',
    },
    // Status colors
    status: {
      positive: isDark ? 'text-green-400' : 'text-green-600',
      negative: isDark ? 'text-red-400' : 'text-red-600',
      neutral: isDark ? 'text-yellow-400' : 'text-yellow-600',
    },
    // Alert/Message styles
    alert: {
      success: isDark
        ? 'bg-green-900/20 border-green-400 text-green-400'
        : 'bg-green-50 border-green-500 text-green-700',
      error: isDark
        ? 'bg-red-900/20 border-red-500 text-red-400'
        : 'bg-red-50 border-red-300 text-red-700',
      info: isDark
        ? 'bg-blue-900/20 border-blue-500 text-blue-400'
        : 'bg-blue-50 border-blue-300 text-blue-700',
    }
  }), [isDark]);

  const getCurrentQuantity = useCallback(() => {
    return orderType === 'market' ? marketQuantity : limitQuantity;
  }, [orderType, marketQuantity, limitQuantity]);
  const quantity = getCurrentQuantity();

  useClickOutside(inputRef, () => setShowSuggestions(false));

  // Helper function to set quantity based on order type
  const handleLogout = () => {
    window.location.href = '/';
  };

  const API_BASE_URL = "http://localhost:8000/api/stocks";

  // Optimized debounced search with caching
  const fetchSuggestions = useMemo(() => {
    const debouncedSearch = (callback, delay) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback(...args), delay);
      };
    };

    const searchFunction = async (value) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const trimmedValue = value.trim().toUpperCase();

      if (!trimmedValue) {
        setSuggestions([]);
        setShowSuggestions(true);
        setSymbolFetching(false);
        return;
      }

      if (searchCacheRef.current.has(trimmedValue)) {
        const cachedData = searchCacheRef.current.get(trimmedValue);
        setSuggestions(cachedData);
        setShowSuggestions(true);
        setSymbolFetching(false);
        return;
      }

      abortControllerRef.current = new AbortController();
      setSymbolFetching(true);
      setLookupError(null);

      try {
        const controller = abortControllerRef.current;

        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 10000);

        const response = await fetch(`${API_BASE_URL}/${trimmedValue}/`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const processedData = Array.isArray(data) ? data.slice(0, 10) : [data];

        searchCacheRef.current.set(trimmedValue, processedData);
        setTimeout(() => {
          searchCacheRef.current.delete(trimmedValue);
        }, 5 * 60 * 1000);

        setSuggestions(processedData);
        setShowSuggestions(true);

      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Search error:', error);
          setLookupError(`Search failed: ${error.message}`);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setSymbolFetching(false);
      }
    };

    return debouncedSearch(searchFunction, 10);
  }, [API_BASE_URL]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const addSearchedStockToWatchlist = async () => {
    if (watchlist.length >= 5) {
      alert("Maximum of 5 stocks allowed in your watchlist. Remove one to add more.");
      return;
    }

    if (lookupResult && lookupResult.symbol) {
      const symbol = lookupResult.symbol.toUpperCase();

      if (watchlist.some(w => w.symbol === symbol)) {
        setWatchlistMessage('Stock is already in your watchlist!');
        setTimeout(() => setWatchlistMessage(''), 5000);
        return;
      }

      try {
        const res = await axiosInstance.post('/watchlist/', { symbol });
        const data = res.data;

        setWatchlist(prev => [...prev, data]);
        setWatchlistMessage('Stock added to watchlist Successfully');
        setTimeout(() => setWatchlistMessage(''), 5000);

        setPrices(prev => ({
          ...prev,
          [symbol]: {
            price: parseFloat(lookupResult.price) || 0,
            change: parseFloat(lookupResult.change) || 0,
            changePercent: parseFloat(lookupResult.changePercent) || 0,
            previousClose: parseFloat(lookupResult.price) || 0,
            volume: 0,
            marketCap: 0,
            companyName: lookupResult.name || symbol,
          },
        }));

        setSelectedStock(symbol);
        setLookupSymbol('');
        setLookupResult(null);
      } catch (error) {
        console.error("Error adding to watchlist:", error);
        setWatchlistMessage(error.response?.data?.detail || "Failed to add to watchlist");
        setTimeout(() => setWatchlistMessage(''), 5000);
      }
    }
  };

  const refreshPortfolio = async () => {
    try {
      const res = await axiosInstance.get('/trade/portfolio_information/');
      setPortfolio(res.data.portfolio_snapshot || {});
      setCash(res.data.cash || 0);
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
    }
  };

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/trade/transactions/');
      setTransactions(res.data.transactions || res.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const res = await axiosInstance.get('/trade/pending_orders/');
      console.log('Pending orders:', res.data.pending_orders || []);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  const removeFromWatchlist = async (symbol) => {
    try {
      await axiosInstance.delete(`/watchlist/remove/?symbol=${symbol}`);
      setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
      const newPrices = { ...prices };
      delete newPrices[symbol];
      setPrices(newPrices);
    } catch (error) {
      console.error("Error deleting from watchlist:", error);
      alert("Failed to delete from watchlist");
    }
  };

  const fetchPrices = async (watchlistArr) => {
    if (!watchlistArr || watchlistArr.length === 0) return;
    const symbols = watchlistArr.map(item => item.symbol);

    try {
      const symbolsParam = symbols.join(',');
      const response = await fetch(`${API_BASE_URL}/quotes?symbols=${symbolsParam}`);
      const data = await response.json();

      if (data.success && data.quotes) {
        const newPrices = {};
        data.quotes.forEach(quote => {
          newPrices[quote.symbol] = {
            price: parseFloat(quote.regularMarketPrice) || 0,
            change: parseFloat(quote.regularMarketChange) || 0,
            changePercent: parseFloat(quote.regularMarketChangePercent) || 0,
            previousClose: parseFloat(quote.previousClose) || 0,
            volume: quote.volume || 0,
            marketCap: quote.marketCap || 0,
            companyName: quote.longName || quote.shortName || quote.symbol
          };
        });

        setPrices(prevPrices => ({
          ...prevPrices,
          ...newPrices
        }));
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const buyStock = useCallback(async () => {
    const stockData = prices[selectedStock];
    if (!stockData || stockData.price <= 0) {
      alert('Stock data not available or invalid price');
      return;
    }

    const currentPrice = stockData.price;
    const quantity = getCurrentQuantity();

    try {
      if (orderType === 'limit') {
        if (!limitPrice || parseFloat(limitPrice) <= 0) {
          alert('Please enter a valid limit price');
          return;
        }

        const parsedLimit = parseFloat(limitPrice);

        if (currentPrice > parsedLimit) {
          await axiosInstance.post('/trade/buy/', {
            symbol: selectedStock,
            quantity,
            order_type: 'LIMIT',
            limit_price: parsedLimit,
          });

          setSuccessMessage('Buy limit order placed and pending execution');
          setTimeout(() => setSuccessMessage(''), 5000);
          await refreshPortfolio();
          await fetchPendingOrders();
          return;
        }
      }

      const response = await axiosInstance.post('/trade/buy/', {
        symbol: selectedStock,
        quantity,
        order_type: orderType.toUpperCase(),
        limit_price: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
      });

      setSuccessMessage(response.data.message || 'Buy order placed');
      setTimeout(() => setSuccessMessage(''), 5000);
      await refreshPortfolio();
      await fetchPendingOrders();
    } catch (error) {
      console.error('Buy failed:', error);
      alert(error.response?.data?.error || 'Failed to buy stock');
    } finally {
      setMarketQuantity(1);
      setLimitQuantity(1);
      setLimitPrice('');
    }
  }, [selectedStock, prices, orderType, limitPrice, getCurrentQuantity]);

  const sellStock = useCallback(async () => {
    const stockData = prices[selectedStock];
    if (!stockData || stockData.price <= 0) {
      alert('Stock data not available or invalid price');
      return;
    }

    const currentPrice = stockData.price;
    const quantity = getCurrentQuantity();

    try {
      if (orderType === 'limit') {
        if (!limitPrice || parseFloat(limitPrice) <= 0) {
          alert('Please enter a valid limit price');
          return;
        }

        const parsedLimit = parseFloat(limitPrice);

        if (currentPrice < parsedLimit) {
          await axiosInstance.post('/trade/sell/', {
            symbol: selectedStock,
            quantity,
            order_type: 'LIMIT',
            limit_price: parsedLimit,
          });

          setSuccessMessage('Sell limit order placed and pending execution');
          setTimeout(() => setSuccessMessage(''), 5000);
          await refreshPortfolio();
          await fetchPendingOrders();
          return;
        }
      }

      const response = await axiosInstance.post('/trade/sell/', {
        symbol: selectedStock,
        quantity,
        order_type: orderType.toUpperCase(),
        limit_price: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
      });

      setSuccessMessage(response.data.message || 'Sell order placed');
      setTimeout(() => setSuccessMessage(''), 5000);
      await refreshPortfolio();
      await fetchPendingOrders();
    } catch (error) {
      console.error('Sell failed:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to sell stock';
      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(''), 5000);
    } finally {
      setMarketQuantity(1);
      setLimitQuantity(1);
      setLimitPrice('');
    }
  }, [selectedStock, prices, orderType, limitPrice, getCurrentQuantity]);

  // UseEffect hooks for data fetching and initialization
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await axiosInstance.get('/watchlist/');
        const watchlistData = res.data;
        setWatchlist(watchlistData);

        const symbols = watchlistData.map(item => item.symbol);
        if (symbols.length > 0) {
          const pricesData = {};
          for (const symbol of symbols) {
            try {
              const priceRes = await fetch(`${API_BASE_URL}/${symbol}/`);
              const priceData = await priceRes.json();
              const stockInfo = Array.isArray(priceData) ? priceData[0] : priceData;

              pricesData[symbol] = {
                price: parseFloat(stockInfo.price) || 0,
                change: parseFloat(stockInfo.change) || 0,
                changePercent: parseFloat(stockInfo.changePercent) || 0,
                previousClose: parseFloat(stockInfo.previousClose) || 0,
                volume: stockInfo.volume || 0,
                marketCap: stockInfo.marketCap || 0,
                companyName: stockInfo.name || symbol,
              };
            } catch (err) {
              console.error(`Error fetching price for ${symbol}`, err);
            }
          }
          setPrices(pricesData);
        }
      } catch (error) {
        console.error("Error fetching watchlist:", error);
      }
    };
    fetchWatchlist();
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/user/cash/');
        const data = await response.json();
        setCash(data.default_balance);
      } catch (error) {
        setCash(50000);
      }
    };
    fetchBalance();
  }, []);

  useEffect(() => {
    const fetchMarketStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/market-status/');
        const data = await response.json();

        if (data && typeof data.is_open === 'boolean') {
          setMarketStatusData(data);
        } else {
          throw new Error('Unexpected market status response');
        }
      } catch (error) {
        console.error('Failed to fetch market status:', error);
        setMarketStatusData({ message: 'Unknown', is_open: null });
      }
    };
    fetchMarketStatus();
  }, []);

  useEffect(() => {
    if (watchlist.length > 0) {
      fetchPrices(watchlist);
      const interval = setInterval(() => {
        fetchPrices(watchlist);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [watchlist]);

  useEffect(() => {
    if (!selectedStock && watchlist.length > 0) {
      setSelectedStock(watchlist[0].symbol);
    }
  }, [watchlist, selectedStock]);

  useEffect(() => {
    if (showTradePanel) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showTradePanel]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await axiosInstance.get('/trade/portfolio_information/');
        setPortfolio(res.data.portfolio_snapshot || {});
        setCash(res.data.cash || 0);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      }
    };
    fetchPortfolio();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshPortfolio();
      fetchTransactions();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log("Tokeeeeeeeeeeeeeeeeeeeeennnn", token);
      const res = await fetch('http://localhost:8000/api/user/profile/', {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Error response:", text);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const html = await res.text();
        console.error("Expected JSON but got HTML:", html.slice(0, 100));
        return;
      }

      const data = await res.json();
      setUserDetails(data);
      setFirstName(data.first_name || 'User');
      console.log("First Nameeeeeeeeeeeeeeeeeeeeee", data.first_name);
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  };
  // Toggle profile side panel
  const toggleProfileSidePanel = () => {
    if (!showProfileSidePanel) {
      fetchUserProfile();
    }
    setShowProfileSidePanel(!showProfileSidePanel);
  };

  const debugTokenStorage = () => {
    console.log("=== TOKEN DEBUG ===");
    console.log("authToken:", localStorage.getItem('authToken'));
    console.log("token:", localStorage.getItem('token'));
    console.log("All localStorage keys:", Object.keys(localStorage));
    console.log("==================");
  };

  // Update your handleSaveProfile function
  const handleSaveProfile = async () => {
    try {
      debugTokenStorage();
      const token = localStorage.getItem('authToken');
      const res = await fetch('http://localhost:8000/api/user/profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(userDetails),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to save profile');
      }

      const data = await res.json();
      setUserDetails(data);
      setSaveMessage('Profile saved successfully!');
      setIsSaveSuccess(true);

      // Clear message after 5 seconds
      setTimeout(() => {
        setSaveMessage('');
        setIsSaveSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage(error.message || 'An error occurred while saving your profile.');
      setIsSaveSuccess(false);

      // Clear error message after 5 seconds
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPortfolio();
      fetchTransactions();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  useEffect(() => {
    const storedName = localStorage.getItem('firstName');
    if (storedName) {
      setFirstName(storedName);
    } else {
      fetchUserProfile();
    }
  }, []);
  const handleChangePassword = async () => {
    // 1️Check for empty fields before sending request
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      setTimeout(() => setPasswordError(''), 3000);
      return;
    }

    //  Check if new passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      setTimeout(() => setPasswordError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('http://localhost:8000/api/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || 'Failed to change password');
        setTimeout(() => setPasswordError(''), 3000);
      } else {
        setPasswordSuccess(data.message || 'Password changed successfully');
        setPasswordError('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);
      }
    } catch (err) {
      setPasswordError('Network error');
      setTimeout(() => setPasswordError(''), 3000);
    }
  };

  // JSX RETURN STARTS HERE
  return (
    <div className={`min-h-screen ${themeStyles.bg.primary} ${themeStyles.text.primary} transition-colors duration-200`}>
      {/* Header */}
      <header className={`${themeStyles.bg.secondary} ${themeStyles.border.primary} border-b fixed top-0 w-full z-50 shadow-sm transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="Logo" className="w-9 h-9 rounded-xs shadow-lg" />
              <span className={`text-xl font-semibold ${themeStyles.text.primary}`}>EducateTrade</span>
            </div>

            <nav className="flex items-center space-x-8 text-lg">
              <button
                onClick={() => navigate('/portfolio')}
                className={`font-medium transition-colors duration-200 ${isActive('/portfolio')
                  ? themeStyles.text.primary
                  : `${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`
                  }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => navigate('/trade')}
                className={`font-medium transition-colors duration-200 ${isActive('/trade')
                  ? themeStyles.text.primary
                  : `${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`
                  }`}
              >
                Trade
              </button>

              <button
                onClick={() => navigate('/research')}
                className={`font-medium transition-colors duration-200 ${isActive('/research')
                  ? themeStyles.text.primary
                  : `${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`
                  }`}
              >
                Research
              </button>

              <button
                onClick={() => navigate('/news')}
                className={`font-medium transition-colors duration-200 ${isActive('/news')
                  ? themeStyles.text.primary
                  : `${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`
                  }`}
              >
                News
              </button>

              <button
                onClick={() => navigate('/orders')}
                className={`font-medium transition-colors duration-200 ${isActive('/orders')
                  ? themeStyles.text.primary
                  : `${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`
                  }`}
              >
                Orders
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDark(prev => !prev)}
                className={`${themeStyles.button.secondary} ${themeStyles.text.primary} px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? (
                  <FaMoon className="text-gray-300" />
                ) : (
                  <FaSun className="text-black" />
                )}
              </button>

              <div className={`${themeStyles.button.primary} text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200`}>
                £{cash.toFixed(2)}
              </div>

              {/* <button 
                onClick={handleLogout} 
                className={`${themeStyles.button.danger} text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500`}
              >
                LOGOUT
              </button> */}
              {/* Profile button */}
              <button
                onClick={toggleProfileSidePanel}
                className="flex items-center space-x-1 text-white-400 font-medium hover:text-white-300"
              >
                <UserCircleIcon className="w-7 h-7" />
                <span>Hi, {firstName || 'User'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-20">

          {/* Left Column - Search and Market Prices */}
          <div className="lg:col-span-2">
            {watchlistMessage && (
              <div className={`flex items-center gap-2 p-3 border-l-4 font-medium text-lg mt-6 mb-2 rounded transition-all duration-200 ${themeStyles.alert.success}`}>
                <span>✅</span>
                {watchlistMessage}
              </div>
            )}

            {/* Search Section */}
            <div className={`p-6 rounded-lg border mb-6 transition-all duration-200 ${themeStyles.bg.secondary} ${themeStyles.border.primary} hover:shadow-lg`}>
              <h2 className={`text-xl font-bold mb-4 ${themeStyles.text.primary}`}>Search & Add Stocks</h2>
              <div className="space-y-4">
                <div className="relative w-full">
                  <div className="flex gap-2 items-center">
                    <div className="relative w-full" ref={inputRef}>
                      <input
                        type="text"
                        placeholder="Enter stock symbol (e.g. AAPL)"
                        className={`w-full p-3 border rounded ${themeStyles.input.focus} pr-10 transition-all duration-200 ${themeStyles.input.base}`}
                        value={lookupSymbol}
                        onChange={e => {
                          const value = e.target.value.toUpperCase();
                          setLookupSymbol(value);
                          fetchSuggestions(value);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                      />

                      {/* Loading Spinner */}
                      {symbolFetching && (
                        <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && lookupSymbol && (
                    <ul className={`absolute border rounded w-full z-10 max-h-60 overflow-y-auto mt-1 transition-colors duration-200 ${themeStyles.bg.secondary} ${themeStyles.border.secondary} ${themeStyles.text.primary}`}>
                      {suggestions.length === 1 && suggestions[0].error ? (
                        <li className={`px-4 py-2 cursor-default ${themeStyles.status.negative}`}>
                          {suggestions[0].error}
                        </li>
                      ) : (
                        suggestions.map((item) => (
                          <li
                            key={item.symbol}
                            onClick={() => {
                              setLookupSymbol("");
                              setShowSuggestions(false);
                              setLookupResult(item);
                            }}
                            className={`px-4 py-2 cursor-pointer transition-colors duration-200 ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                              }`}
                          >
                            <div className="flex items-center space-x-16">
                              <span className="font-bold w-20">{item.symbol}</span>
                              {item.name && <span>{item.name.replaceAll('"', '')}</span>}
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>

                {lookupError && (
                  <div className={`p-3 rounded border transition-colors duration-200 ${themeStyles.alert.error}`}>
                    {lookupError}
                  </div>
                )}

                {lookupResult && (
                  <div className={`p-4 rounded border transition-colors duration-200 ${themeStyles.bg.tertiary} ${themeStyles.border.secondary}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {lookupResult.symbol}
                          </h3>
                          <span className={themeStyles.text.tertiary}>-</span>
                          <span className={themeStyles.text.secondary}>{lookupResult.name}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Price:</span>
                              <span className="ml-2 font-semibold">£{parseFloat(lookupResult.price || 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Currency:</span>
                              <span className="ml-2">{lookupResult.currency || 'USD'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Change:</span>
                              <span className={`ml-2 ${parseFloat(lookupResult.change) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {parseFloat(lookupResult.change || 0) >= 0 ? '+' : ''}£{parseFloat(lookupResult.change || 0).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Change %:</span>
                              <span className={`ml-2 ${parseFloat(lookupResult.changePercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {parseFloat(lookupResult.changePercent || 0) >= 0 ? '+' : ''}{parseFloat(lookupResult.changePercent || 0).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={addSearchedStockToWatchlist}
                        disabled={watchlist.length >= 5}
                        className={`px-4 py-2 rounded transition-colors duration-200 ${watchlist.length >= 5
                          ? `${themeStyles.button.disabled} cursor-not-allowed text-white`
                          : `${themeStyles.button.primary} text-white`
                          }`}
                      >
                        Add to Watchlist
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Watchlist */}
            <div className={`p-6 rounded-lg border mb-6 transition-all duration-200 ${themeStyles.bg.secondary} ${themeStyles.border.primary} hover:shadow-lg`}>
              <h2 className={`text-xl font-bold mb-4 ${themeStyles.text.primary}`}>Market Prices ({watchlist.length} stocks)</h2>
              {watchlist.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">📈</div>
                  <p className={`mb-2 ${themeStyles.text.tertiary}`}>No stocks in your watchlist yet</p>
                  <p className={`text-sm ${themeStyles.text.quaternary}`}>Search for stocks above and add them to your watchlist to see live prices</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watchlist.map((item) => {
                    const symbol = item.symbol;
                    const stockData = prices[symbol];
                    if (!stockData) {
                      return (
                        <div key={symbol} className={`p-4 rounded border animate-pulse transition-colors duration-200 ${themeStyles.border.secondary}`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className={`font-bold text-lg ${themeStyles.text.primary}`}>{symbol}</p>
                              <p className={`text-xs ${themeStyles.text.tertiary}`}>Loading...</p>
                            </div>
                            <div className={themeStyles.text.tertiary}>Loading prices...</div>
                          </div>
                        </div>
                      );
                    }

                    const isPositive = stockData.changePercent >= 0;
                    const priceChangeIcon = isPositive ? '↑' : '↓';

                    return (
                      <div
                        key={symbol}
                        className={`relative p-4 rounded border cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedStock === symbol
                          ? isDark
                            ? 'border-blue-500 bg-blue-900/20 shadow-blue-500/20'
                            : 'border-blue-500 bg-blue-50 shadow-blue-500/20'
                          : `${themeStyles.border.secondary} hover:${themeStyles.border.tertiary}`
                          }`}
                        onClick={() => setSelectedStock(symbol)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(item.symbol);
                          }}
                          className="absolute top-0 right-3.5 text-red-400 hover:text-red-300 text-sm"
                          title="Remove from watchlist"
                        >
                          ✕
                        </button>
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-bold text-lg ${themeStyles.text.primary}`}>{symbol}</p>
                              <span className={`text-sm leading-none ${isPositive ? themeStyles.status.positive : themeStyles.status.negative
                                }`}>
                                {priceChangeIcon}
                              </span>
                            </div>
                            <p className={`text-xs mb-2 truncate ${themeStyles.text.tertiary}`} title={stockData.companyName}>
                              {stockData.companyName}
                            </p>
                            <p className={`text-2xl font-bold ${themeStyles.text.primary}`}>£{stockData.price.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${isPositive ? themeStyles.status.positive : themeStyles.status.negative
                              }`}>
                              {isPositive ? '+' : ''}£{stockData.change.toFixed(2)}
                            </p>
                            <p className={`text-sm font-medium ${isPositive ? themeStyles.status.positive : themeStyles.status.negative
                              }`}>
                              {isPositive ? '+' : ''}{stockData.changePercent.toFixed(2)}%
                            </p>
                            <div className={`text-xs mt-1 ${themeStyles.text.tertiary}`}>
                              Owned: {portfolio[symbol] || 0}

                              <div className="mt-2 flex justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTradeType("Buy");
                                    setSelectedStock(symbol);
                                    setShowTradePanel(true);
                                  }}
                                  className={`px-2 py-1 ${themeStyles.button.primary} text-white text-xs rounded transition-colors duration-200`}
                                >
                                  Trade
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Market Status and Trading Panel */}
          <div className="space-y-6">
            {/* Market Status */}
            <div>
              <SummaryCard
                label="Market Status"
                value={
                  <>
                    <div>{marketStatusData?.message || 'Loading...'}</div>
                    {marketStatusData?.is_open === true && (
                      <div className={`text-xs mt-1 ${themeStyles.text.tertiary}`}>
                        Closes at <span className="font-medium">{marketStatusData.market_close}</span> ({marketStatusData.timezone})
                      </div>
                    )}
                    {marketStatusData?.is_open === false && (
                      <div className={`text-xs mt-1 ${themeStyles.text.tertiary}`}>
                        Opens at <span className="font-medium">{marketStatusData.market_open}</span> ({marketStatusData.timezone})
                      </div>
                    )}
                  </>
                }
                icon={
                  marketStatusData?.is_open ? '🟢' :
                    marketStatusData?.is_open === false ? '🔴' : '⏳'
                }
                color={
                  marketStatusData?.is_open
                    ? themeStyles.status.positive :
                    marketStatusData?.is_open === false
                      ? themeStyles.status.negative
                      : themeStyles.status.neutral
                }
                themeStyles={themeStyles}
              />
            </div>

            {/* Trading Panel Modal */}
            {showTradePanel && (
              <div
                className="bg-black bg-opacity-60 flex justify-center items-center"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100vw',
                  height: '100vh',
                  margin: 0,
                  padding: 0,
                  zIndex: 9999,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)'
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowTradePanel(false);
                  }
                }}
              >
                <div
                  className={`p-2 pt-2 rounded-lg border w-[70vw] max-w-sm max-h-[95vh] shadow-2xl overflow-hidden relative transition-colors duration-200 ${themeStyles.bg.modal} ${themeStyles.border.secondary}`}
                  onClick={(e) => e.stopPropagation()}
                >

                  <button
                    onClick={() => setShowTradePanel(false)}
                    className={`absolute top-2 right-3 text-xl z-10 transition-colors duration-200 ${themeStyles.text.tertiary} hover:${themeStyles.text.primary}`}
                  >
                    &times;
                  </button>

                  <div className="p-1 space-y-1 overflow-y-auto">
                    <h2 className={`text-lg font-bold mb-1 ${themeStyles.text.primary}`}>Place Order</h2>

                    {/* Stock Selection */}
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${themeStyles.text.secondary}`}>Stock</label>
                      {selectedStock && prices[selectedStock] ? (
                        <div className={`p-2 border rounded text-sm transition-colors duration-200 ${themeStyles.bg.tertiary} ${themeStyles.border.secondary}`}>
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${themeStyles.text.primary}`}>{selectedStock}</span>
                            <span className={themeStyles.status.positive}>£{prices[selectedStock].price.toFixed(2)}</span>
                          </div>
                          <div className={`text-xs truncate ${themeStyles.text.tertiary}`}>
                            {prices[selectedStock].companyName}
                          </div>
                        </div>
                      ) : (
                        <select
                          value={selectedStock || ''}
                          onChange={e => setSelectedStock(e.target.value)}
                          className={`w-full p-2 border rounded ${themeStyles.input.focus} text-sm transition-colors duration-200 ${themeStyles.input.base}`}
                        >
                          <option value="">Select stock...</option>
                          {watchlist
                            .filter(item => prices[item.symbol] && prices[item.symbol].price > 0)
                            .map(item => (
                              <option key={item.symbol} value={item.symbol}>
                                {item.symbol} - £{prices[item.symbol].price.toFixed(2)}
                              </option>
                            ))
                          }
                        </select>
                      )}
                    </div>

                    {/* Order Type */}
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${themeStyles.text.secondary}`}>Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setOrderType('market')}
                          className={`p-2 rounded border text-xs transition-all duration-200 ${orderType === 'market'
                            ? 'border-blue-500 bg-blue-900/30 text-blue-400'
                            : `${themeStyles.border.secondary} ${themeStyles.bg.tertiary} hover:${themeStyles.border.tertiary}`
                            }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>⚡</span>
                            <span>Market</span>
                          </div>
                        </button>

                        <button
                          onClick={() => setOrderType('limit')}
                          className={`p-2 rounded border text-xs transition-all duration-200 ${orderType === 'limit'
                            ? 'border-yellow-500 bg-yellow-900/30 text-yellow-400'
                            : `${themeStyles.border.secondary} ${themeStyles.bg.tertiary} hover:${themeStyles.border.tertiary}`
                            }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>🎯</span>
                            <span>Limit</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Quantity and Limit Price */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Quantity */}
                      {orderType === 'market' ? (
                        <div className="mb-4">
                          <label className={`block text-sm font-medium mb-1 ${themeStyles.text.secondary}`}>
                            Market Order Quantity
                          </label>
                          <input
                            type="number"
                            value={marketQuantity === 0 ? '' : marketQuantity}
                            onChange={e => {
                              const value = e.target.value;
                              if (value === '') {
                                setMarketQuantity(0);
                              } else if (/^\d+$/.test(value)) {
                                setMarketQuantity(Number(value));
                              }
                            }}
                            placeholder="0"
                            min="1"
                            className={`w-full p-2 border rounded ${themeStyles.input.focus} text-sm transition-colors duration-200 ${themeStyles.input.base}`}
                          />
                        </div>
                      ) : (
                        <div className="mb-4">
                          <label className={`block text-sm font-medium mb-1 ${themeStyles.text.secondary}`}>
                            Limit Order Quantity
                          </label>
                          <input
                            type="number"
                            value={limitQuantity === 0 ? '' : limitQuantity}
                            onChange={e => {
                              const value = e.target.value;
                              if (value === '') {
                                setLimitQuantity(0);
                              } else if (/^\d+$/.test(value)) {
                                setLimitQuantity(Number(value));
                              }
                            }}
                            placeholder="0"
                            min="1"
                            className={`w-full p-2 border rounded ${themeStyles.input.focus} text-sm transition-colors duration-200 ${themeStyles.input.base}`}
                          />
                        </div>
                      )}

                      {/* Limit Price - Only show for limit orders */}
                      {orderType === 'limit' && selectedStock && prices[selectedStock] ? (
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${themeStyles.text.secondary}`}>
                            Limit Price
                          </label>
                          <div className="relative">
                            <span className={`absolute left-2 top-1/2 transform -translate-y-1/2 text-sm ${themeStyles.text.tertiary}`}>£</span>
                            <input
                              type="number"
                              value={limitPrice}
                              onChange={e => setLimitPrice(e.target.value)}
                              className={`w-full pl-6 pr-2 py-2 border rounded ${themeStyles.input.focus} text-sm transition-colors duration-200 ${themeStyles.input.base}`}
                              step="0.01"
                              min="0.01"
                              placeholder={prices[selectedStock].price.toFixed(2)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </div>

                    {/* Quick Price Buttons - Only for limit orders */}
                    {orderType === 'limit' && selectedStock && prices[selectedStock] && (
                      <div>
                        <div className="flex gap-1 justify-between">
                          {[
                            { label: '-2%', value: (prices[selectedStock].price * 0.98).toFixed(2) },
                            { label: '-1%', value: (prices[selectedStock].price * 0.99).toFixed(2) },
                            { label: 'Mkt', value: prices[selectedStock].price.toFixed(2) },
                            { label: '+1%', value: (prices[selectedStock].price * 1.01).toFixed(2) },
                            { label: '+2%', value: (prices[selectedStock].price * 1.02).toFixed(2) },
                          ].map((suggestion) => (
                            <button
                              key={suggestion.label}
                              onClick={() => setLimitPrice(suggestion.value)}
                              className={`px-2 py-1 text-xs rounded border flex-1 transition-colors duration-200 ${themeStyles.button.secondary} ${themeStyles.text.secondary}`}
                            >
                              {suggestion.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Summary */}
                    {selectedStock && prices[selectedStock] && prices[selectedStock].price > 0 && (
                      <div className={`p-1 rounded border transition-colors duration-200 ${themeStyles.bg.tertiary} ${themeStyles.border.secondary}`}>
                        <h3 className={`font-medium mb-2 text-sm ${themeStyles.text.primary}`}>Summary</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className={themeStyles.text.tertiary}>Stock:</span>
                            <span className={themeStyles.text.primary}>{selectedStock}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={themeStyles.text.tertiary}>Type:</span>
                            <span className={`capitalize ${themeStyles.text.primary}`}>{orderType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={themeStyles.text.tertiary}>Qty:</span>
                            <span className={themeStyles.text.primary}>{quantity} shares</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={themeStyles.text.tertiary}>Price:</span>
                            <span className={themeStyles.text.primary}>
                              {orderType === 'market'
                                ? `£${prices[selectedStock].price.toFixed(2)}`
                                : limitPrice
                                  ? `£${parseFloat(limitPrice).toFixed(2)}`
                                  : 'Not set'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={themeStyles.text.tertiary}>Cash:</span>
                            <span className={themeStyles.status.positive}>£{cash.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={themeStyles.text.tertiary}>Owned:</span>
                            <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{portfolio[selectedStock] || 0}</span>
                          </div>
                          <div className={`flex justify-between font-medium pt-1 border-t ${themeStyles.border.secondary}`}>
                            <span className={themeStyles.text.tertiary}>Total:</span>
                            <span className={themeStyles.text.primary}>
                              £{(orderType === 'market'
                                ? prices[selectedStock].price * quantity
                                : limitPrice
                                  ? parseFloat(limitPrice) * quantity
                                  : 0
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                      <div className={`flex items-center gap-1 p-1 mt-1 mb-1 rounded-md font-inter text-xs transition-colors duration-200 ${tradeType === "Buy"
                        ? themeStyles.alert.success
                        : themeStyles.alert.error
                        }`}>
                        <span>{tradeType === "Buy" ? "✅" : "❌"}</span>
                        <span>{successMessage}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={buyStock}
                        disabled={!selectedStock || !prices[selectedStock] || prices[selectedStock].price <= 0}
                        className={`flex-1 ${themeStyles.button.success} disabled:${themeStyles.button.disabled} disabled:cursor-not-allowed text-white py-2 px-4 rounded font-bold transition-colors duration-200 text-sm`}
                      >
                        BUY
                      </button>
                      <button
                        onClick={sellStock}
                        disabled={!selectedStock || !prices[selectedStock] || prices[selectedStock].price <= 0}
                        className={`flex-1 ${themeStyles.button.danger} disabled:${themeStyles.button.disabled} disabled:cursor-not-allowed text-white py-2 px-4 rounded font-bold transition-colors duration-200 text-sm`}
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions */}
            <div className={`p-6 rounded-lg border transition-all duration-200 ${themeStyles.bg.secondary} ${themeStyles.border.primary} hover:shadow-lg`}>
              <h2 className={`text-xl font-bold mb-4 ${themeStyles.text.primary}`}>Recent Transactions</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transactions.length === 0 ? (
                  <p className={`text-center py-4 ${themeStyles.text.tertiary}`}>No transactions yet</p>
                ) : (
                  transactions.map(transaction => (
                    <div key={transaction.id} className={`flex justify-between items-center p-3 rounded border transition-colors duration-200 ${themeStyles.bg.tertiary} ${themeStyles.border.secondary}`}>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${transaction.type === 'BUY' ? 'bg-green-600' : 'bg-red-600'
                            } text-white`}
                        >
                          {transaction.type}
                        </span>
                        <span className={`font-medium ${themeStyles.text.primary}`}>{transaction.symbol}</span>
                        <span className={themeStyles.text.tertiary}>×{transaction.quantity}</span>
                        <span className={themeStyles.text.tertiary}>@£{transaction.price.toFixed(2)}</span>
                      </div>
                      <div className="text-right text-sm">
                        <div className={`font-medium ${themeStyles.text.primary}`}>£{transaction.total.toFixed(2)}</div>
                        <div className={`text-xs ${themeStyles.text.tertiary}`}>{transaction.timestamp}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showProfileSidePanel && (
        <div className="fixed top-0 right-0 h-full w-96 bg-slate-800/50 backdrop-blur-sm text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-700/40">

          <div className="h-full flex flex-col relative">

            {/*  Close Button (top-right corner) */}
            <button
              onClick={toggleProfileSidePanel}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-600/30 z-10"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/*Panel Content starts here directly */}
            <div className="flex-1 overflow-y-auto p-6 pt-10">
              {userDetails ? (
                <>
                  {/* User Info Section */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <UserCircleIcon className="w-14 h-14 text-blue-400/90" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-100">
                        {userDetails.first_name} {userDetails.last_name}
                      </h3>
                      <p className="text-sm text-gray-400/90">{userDetails.email}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Profile Information Section */}
                    <div className="space-y-5">
                      <h3 className="text-base font-medium text-gray-300 tracking-wide">PROFILE INFORMATION</h3>

                      {saveMessage && (
                        <div className={`p-3 rounded-md text-sm ${isSaveSuccess
                          ? 'bg-green-900/20 text-green-300'
                          : 'bg-red-900/20 text-red-300'
                          }`}>
                          {saveMessage}
                        </div>
                      )}

                      <div className="space-y-4">
                        {[
                          ['First Name', 'first_name'],
                          ['Last Name', 'last_name'],
                          ['Email', 'email'],
                          ['Date of Birth', 'date_of_birth'],
                          ['Phone', 'phone'],
                          ['Address', 'address'],
                        ].map(([label, field]) => (
                          <div key={field} className="space-y-1">
                            <label className="text-xs font-medium text-gray-400/80 uppercase tracking-wider">
                              {label}
                            </label>
                            <input
                              type="text"
                              className="w-full p-2.5 bg-slate-700/50 border border-slate-600/30 rounded-md focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-gray-100 placeholder-gray-500"
                              value={userDetails[field] || ''}
                              onChange={(e) => setUserDetails({ ...userDetails, [field]: e.target.value })}
                            />
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>

                    {/* Change Password Section */}
                    <div className="space-y-3">
                      <div
                        className="flex justify-between items-center cursor-pointer group"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                      >
                        <h3 className="text-base font-medium text-gray-300 tracking-wide group-hover:text-gray-200 transition-colors">
                          CHANGE PASSWORD
                        </h3>
                        <ChevronDownIcon
                          className={`w-4 h-4 text-gray-400 transition-all duration-200 ${showPasswordForm ? 'transform rotate-180' : ''}`}
                        />
                      </div>

                      {showPasswordForm && (
                        <div className="mt-3 space-y-4 pl-1 border-l-2 border-slate-600/30">
                          {/* Current Password */}
                          <div className="relative">
                            <input
                              type={showCurrent ? 'text' : 'password'}
                              placeholder="Current Password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full p-2.5 bg-slate-700/50 border border-slate-600/30 rounded-md focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-gray-100 placeholder-gray-500 pr-10"
                            />
                            <div
                              className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-400 hover:text-white transition-colors"
                              onClick={() => setShowCurrent(!showCurrent)}
                            >
                              {showCurrent ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </div>
                          </div>

                          {/* New Password */}
                          <div className="relative">
                            <input
                              type={showNew ? 'text' : 'password'}
                              placeholder="New Password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full p-2.5 bg-slate-700/50 border border-slate-600/30 rounded-md focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-gray-100 placeholder-gray-500 pr-10"
                            />
                            <div
                              className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-400 hover:text-white transition-colors"
                              onClick={() => setShowNew(!showNew)}
                            >
                              {showNew ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </div>
                          </div>

                          {/* Confirm Password */}
                          <div className="relative">
                            <input
                              type={showConfirm ? 'text' : 'password'}
                              placeholder="Confirm New Password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full p-2.5 bg-slate-700/50 border border-slate-600/30 rounded-md focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-gray-100 placeholder-gray-500 pr-10"
                            />
                            <div
                              className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-400 hover:text-white transition-colors"
                              onClick={() => setShowConfirm(!showConfirm)}
                            >
                              {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </div>
                          </div>

                          {passwordError && (
                            <div className="text-red-400 text-sm py-2 px-3 bg-red-900/20 rounded-md">
                              {passwordError}
                            </div>
                          )}
                          {passwordSuccess && (
                            <div className="text-green-400 text-sm py-2 px-3 bg-green-900/20 rounded-md">
                              {passwordSuccess}
                            </div>
                          )}

                          <button
                            onClick={handleChangePassword}
                            className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded transition-colors border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-medium"
                          >
                            Change Password
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Logout Section */}
                    <div className="pt-4 border-t border-slate-600/30">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500/50 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading profile...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// {/* Password Change Modal */}
// {showPasswordModal && (
//   <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
// )}

// Helper Components
const SummaryCard = ({ label, value, icon, color, themeStyles }) => (
  <div className={`p-6 rounded-lg border transition-all duration-200 ${themeStyles.bg.secondary} ${themeStyles.border.primary} hover:shadow-lg`}>
    <div className="flex justify-between items-center">
      <div>
        <p className={`text-sm ${themeStyles.text.tertiary}`}>{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`text-2xl ${color}`}>{icon}</div>
    </div>
  </div>
);

export default Trade;
