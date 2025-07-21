// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import axiosInstance from './utils/axiosInstance';
// import logo from './assets/tradelogo.png';
// import { FiSearch, FiFilter, FiX, FiRefreshCw } from 'react-icons/fi';

// const Orders = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [searchTerm, setSearchTerm] = useState('');
//   const [cash, setCash] = useState(0);
//   const [orders, setOrders] = useState([]);
//   const [filteredOrders, setFilteredOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('open'); // 'open', 'history'
//   const [openOrders, setOpenOrders] = useState([]);
//   const [orderHistory, setOrderHistory] = useState([]);
//   const [filteredOpenOrders, setFilteredOpenOrders] = useState([]);
//   const [filteredOrderHistory, setFilteredOrderHistory] = useState([]);
//   const [sortBy, setSortBy] = useState('date');
//   const [sortOrder, setSortOrder] = useState('desc');

//   const isActive = (path) => location.pathname === path;

//   // Helper function to determine if an order is truly "open"
//   const isOrderOpen = (order) => {
//     const status = order.status?.toLowerCase();
//     return status === 'pending' || status === 'open' || status === 'submitted' || status === 'partial';
//   };

//   // Helper function to determine if an order is closed/completed
//   const isOrderClosed = (order) => {
//     const status = order.status?.toLowerCase();
//     return status === 'filled' || status === 'executed' || status === 'cancelled' || status === 'rejected';
//   };

//   const fetchOrders = useCallback(async () => {
//     setLoading(true);
//     try {
//       const response = await axiosInstance.get('/trade/orders/');

//       // Get the raw orders from backend
//       const rawOpenOrders = response.data.open_orders || [];
//       const rawOrderHistory = response.data.order_history || [];

//       // Filter open orders to only include truly open orders
//       const actualOpenOrders = rawOpenOrders.filter(order => isOrderOpen(order));

//       // Combine all closed orders from both arrays (in case backend miscategorizes)
//       const allOrders = [...rawOpenOrders, ...rawOrderHistory];
//       const actualClosedOrders = allOrders.filter(order => isOrderClosed(order));

//       // Remove duplicates from closed orders (in case an order appears in both arrays)
//       const uniqueClosedOrders = actualClosedOrders.reduce((acc, current) => {
//         const x = acc.find(item => item.id === current.id);
//         if (!x) {
//           return acc.concat([current]);
//         } else {
//           return acc;
//         }
//       }, []);

//       setOpenOrders(actualOpenOrders);
//       setOrderHistory(uniqueClosedOrders);
//     } catch (error) {
//       console.error('Error fetching orders:', error);
//       setOpenOrders([]);
//       setOrderHistory([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Fetch portfolio information
//   useEffect(() => {
//     const fetchPortfolio = async () => {
//       try {
//         const response = await axiosInstance.get('/trade/portfolio_information/');
//         setCash(parseFloat(response.data.cash || 0));
//       } catch (error) {
//         console.error('Error fetching portfolio:', error);
//       }
//     };

//     fetchPortfolio();
//     fetchOrders();
//   }, [fetchOrders]);

//   // Filter and sort orders
//   useEffect(() => {
//     const filterAndSort = (ordersList) => {
//       let filtered = [...ordersList];

//       // Filter by search term
//       if (searchTerm) {
//         filtered = filtered.filter(order =>
//           order.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           order.order_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           order.side?.toLowerCase().includes(searchTerm.toLowerCase())
//         );
//       }

//       // Sort orders
//       filtered.sort((a, b) => {
//         let aValue, bValue;

//         switch (sortBy) {
//           case 'date':
//             aValue = new Date(a.created_at || a.timestamp);
//             bValue = new Date(b.created_at || b.timestamp);
//             break;
//           case 'symbol':
//             aValue = a.symbol || '';
//             bValue = b.symbol || '';
//             break;
//           case 'quantity':
//             aValue = parseFloat(a.quantity || 0);
//             bValue = parseFloat(b.quantity || 0);
//             break;
//           case 'price':
//             aValue = parseFloat(a.price || 0);
//             bValue = parseFloat(b.price || 0);
//             break;
//           default:
//             aValue = a[sortBy] || '';
//             bValue = b[sortBy] || '';
//         }

//         if (sortOrder === 'asc') {
//           return aValue > bValue ? 1 : -1;
//         } else {
//           return aValue < bValue ? 1 : -1;
//         }
//       });

//       return filtered;
//     };

//     setFilteredOpenOrders(filterAndSort(openOrders));
//     setFilteredOrderHistory(filterAndSort(orderHistory));
//   }, [openOrders, orderHistory, searchTerm, sortBy, sortOrder]);

//   // const handleSearch = () => {
//   //   console.log("Searching for:", searchTerm);
//   // };

//   const handleCancelOrder = async (orderId) => {
//     try {
//       await axiosInstance.delete(`/trade/${orderId}/cancel_order/`);
//       fetchOrders(); // Refresh orders after cancellation
//     } catch (error) {
//       console.error('Error cancelling order:', error);
//     }
//   };

//   const handleLogout = () => {
//     window.location.href = '/';
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleString();
//   };

//   const formatCurrency = (amount) => {
//     return `£${parseFloat(amount || 0).toFixed(2)}`;
//   };

//   const getStatusColor = (status) => {
//     switch (status?.toLowerCase()) {
//       case 'filled':
//       case 'executed':
//         return 'text-green-400';
//       case 'pending':
//       case 'open':
//       case 'submitted':
//         return 'text-yellow-400';
//       case 'partial':
//         return 'text-blue-400';
//       case 'cancelled':
//       case 'rejected':
//         return 'text-red-400';
//       default:
//         return 'text-gray-400';
//     }
//   };

//   const getTypeColor = (type) => {
//     switch (type?.toLowerCase()) {
//       case 'market':
//         return 'bg-orange-100 text-orange-800';
//       case 'limit':
//         return 'bg-blue-100 text-blue-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getOrderCounts = () => {
//     return {
//       open: openOrders.length,
//       history: orderHistory.length
//     };
//   };

//   const orderCounts = getOrderCounts();

//   return (
//     <div className="min-h-screen bg-slate-900 text-white">
//       {/* Header Navigation */}
//       <header className="bg-slate-800 border-b border-slate-700 fixed top-0 w-full z-50">
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex items-center justify-between">
//             {/* Logo */}
//             <div className="flex items-center space-x-2">
//               <img src={logo} alt="Logo" className="w-8 h-8" />
//               <span className="text-xl font-semibold text-white">EducateTrade</span>
//             </div>

//             {/* Navigation Links */}
//             <nav className="flex items-center space-x-16 text-xl">
//               <button
//                 onClick={() => navigate('/portfolio')}
//                 className={`font-semibold ${
//                   isActive('/portfolio') ? 'text-white' : 'text-blue-400 hover:text-blue-300'
//                 }`}
//               >
//                 Portfolio
//               </button>
//               <button
//                 onClick={() => navigate('/trade')}
//                 className={`font-semibold ${
//                   isActive('/trade') ? 'text-white' : 'text-blue-400 hover:text-blue-300'
//                 }`}
//               >
//                 Trade
//               </button>
//               <button
//                 onClick={() => navigate('/research')}
//                 className={`font-semibold ${
//                   isActive('/research') ? 'text-white' : 'text-blue-400 hover:text-blue-300'
//                 }`}
//               >
//                 Research
//               </button>
//               <button
//                 onClick={() => navigate('/orders')}
//                 className={`font-semibold ${
//                   isActive('/orders') ? 'text-white' : 'text-blue-400 hover:text-blue-300'
//                 }`}
//               >
//                 Orders
//               </button>
//             </nav>

//             {/* Right Side */}
//             <div className="flex items-center space-x-4">
//               <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
//                 £{cash.toFixed(2)}
//               </div>
//               <button
//                 onClick={handleLogout}
//                 className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
//               >
//                 LOGOUT
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto px-6 py-8">
//         {/* Search and Filters */}
//         <div className="mb-6 space-y-4"> 
//           {/* Search Bar */}
//           <div className="flex items-center space-x-4">
//             {/* <div className="relative flex-1 max-w-md">
//               <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type="text"
//                 placeholder="Search by symbol, type, or side..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//               {searchTerm && (
//                 <button
//                   onClick={() => setSearchTerm('')}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
//                 >
//                   <FiX className="w-4 h-4" />
//                 </button>
//               )}
//             </div> */}

//             <div className="flex justify-between items-center w-full">
//             {/* Left side: Sort controls */}
//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-gray-400">Sort by:</span>
//               <select
//                 value={sortBy}
//                 onChange={(e) => setSortBy(e.target.value)}
//                 className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-white text-sm"
//               >
//                 <option value="date">Date</option>
//                 <option value="symbol">Symbol</option>
//                 <option value="quantity">Quantity</option>
//                 <option value="price">Price</option>
//               </select>
//               <button
//                 onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
//                 className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-white text-sm hover:bg-slate-700"
//               >
//                 {sortOrder === 'asc' ? '↑' : '↓'}
//               </button>
//             </div>

//             {/* Right side: Refresh button */}
//             <button
//               onClick={fetchOrders}
//               className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
//             >
//               <FiRefreshCw className="w-4 h-4" />
//               <span>Refresh</span>
//             </button>
//           </div>

//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex space-x-1 bg-slate-800 rounded-lg p-1">
//           {[
//             { key: 'open', label: 'Open Orders', count: orderCounts.open },
//             { key: 'history', label: 'Order History', count: orderCounts.history }
//           ].map(({ key, label, count }) => (
//             <button
//               key={key}
//               onClick={() => setActiveTab(key)}
//               className={`flex items-center space-x-2 px-6 py-3 rounded-md transition-colors ${
//                 activeTab === key
//                   ? 'bg-blue-600 text-white'
//                   : 'bg-transparent text-gray-400 hover:text-white hover:bg-slate-700'
//               }`}
//             >
//               <span className="font-medium">{label}</span>
//               <span className="bg-slate-700 text-xs px-2 py-1 rounded-full">{count}</span>
//             </button>
//           ))}
//         </div>

//         {/* Orders Content */}
//         <div className="bg-slate-800 rounded-lg overflow-hidden">
//           {loading ? (
//             <div className="flex items-center justify-center py-12">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//             </div>
//           ) : (
//             <>
//               {/* Open Orders Tab */}
//               {activeTab === 'open' && (
//                 <>
//                   {filteredOpenOrders.length === 0 ? (
//                     <div className="text-center py-12 text-gray-400">
//                       <p className="text-lg">No open orders</p>
//                       <p className="text-sm mt-2">
//                         {searchTerm ? 'Try adjusting your search criteria' : 'Your open orders will appear here'}
//                       </p>
//                     </div>
//                   ) : (
//                     <div className="overflow-x-auto">
//                       <table className="w-full">
//                         <thead className="bg-slate-700">
//                           <tr>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Date/Time
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Symbol
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Side
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Order Type
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Quantity
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Price
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Limit Price
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Status
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Actions
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-700">
//                           {filteredOpenOrders.map((order, index) => (
//                             <tr key={order.id || index} className="hover:bg-slate-700">
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
//                                 {formatDate(order.created_at || order.timestamp)}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
//                                 {order.symbol}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm">
//                                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                   order.side?.toLowerCase() === 'buy' 
//                                     ? 'bg-green-100 text-green-800' 
//                                     : 'bg-red-100 text-red-800'
//                                 }`}>
//                                   {order.side?.toUpperCase()}
//                                 </span>
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm">
//                                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                   getTypeColor(order.order_type || order.type)
//                                 }`}>
//                                   {(order.order_type || order.type)?.toUpperCase()}
//                                 </span>
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
//                                 {order.quantity}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
//                                 {formatCurrency(order.price)}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
//                                 {order.limit_price ? formatCurrency(order.limit_price) : '--'}
//                               </td>

//                               <td className="px-6 py-4 whitespace-nowrap text-sm">
//                                 <span className={`${getStatusColor(order.status)} font-medium`}>
//                                   {order.status?.toUpperCase()}
//                                 </span>
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm">
//                                 <button
//                                   onClick={() => handleCancelOrder(order.id)}
//                                   className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
//                                 >
//                                   Cancel
//                                 </button>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </>
//               )}

//               {/* Order History Tab */}
//               {activeTab === 'history' && (
//                 <>
//                   {filteredOrderHistory.length === 0 ? (
//                     <div className="text-center py-12 text-gray-400">
//                       <p className="text-lg">No order history</p>
//                       <p className="text-sm mt-2">
//                         {searchTerm ? 'Try adjusting your search criteria' : 'Your completed orders will appear here'}
//                       </p>
//                     </div>
//                   ) : (
//                     <div className="overflow-x-auto">
//                       <table className="w-full">
//                         <thead className="bg-slate-700">
//                           <tr>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Date/Time
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Symbol
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Side
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Order Type
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Quantity
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Price
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Total Value
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
//                               Status
//                             </th>
//                           </tr>
//                         </thead>
//                          <tbody className="divide-y divide-slate-700">
//                           {filteredOrderHistory.map((order, index) => (
//                             <tr key={order.id || index} className="hover:bg-slate-700">
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
//                                 {formatDate(order.created_at || order.timestamp)}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
//                                 {order.symbol}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm">
//                                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                   order.side?.toLowerCase() === 'buy' 
//                                     ? 'bg-green-100 text-green-800' 
//                                     : 'bg-red-100 text-red-800'
//                                 }`}>
//                                   {order.side?.toUpperCase()}
//                                 </span>
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm">
//                                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                   getTypeColor(order.order_type || order.type)
//                                 }`}>
//                                   {(order.order_type || order.type)?.toUpperCase()}
//                                 </span>
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
//                                 {order.quantity}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
//                                 {formatCurrency(order.price)}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
//                                 {formatCurrency((parseFloat(order.quantity || 0) * parseFloat(order.price || 0)))}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm">
//                                 <span className={`${getStatusColor(order.status)} font-medium`}>
//                                   {order.status?.toUpperCase()}
//                                 </span>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </>
//               )}
//             </>
//           )}
//         </div>

//         {/* Summary Stats */}
//         {(filteredOpenOrders.length > 0 || filteredOrderHistory.length > 0) && (
//           <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="bg-slate-800 rounded-lg p-4">
//               <h3 className="text-sm font-medium text-gray-400">Total Orders</h3>
//               <p className="text-2xl font-bold text-white">{filteredOpenOrders.length + filteredOrderHistory.length}</p>
//             </div>
//             <div className="bg-slate-800 rounded-lg p-4">
//               <h3 className="text-sm font-medium text-gray-400">Open Orders</h3>
//               <p className="text-2xl font-bold text-yellow-400">
//                 {filteredOpenOrders.length}
//               </p>
//             </div>
//             <div className="bg-slate-800 rounded-lg p-4">
//               <h3 className="text-sm font-medium text-gray-400">Filled Orders</h3>
//               <p className="text-2xl font-bold text-green-400">
//                 {filteredOrderHistory.filter(order => order.status === 'filled' || order.status === 'executed').length}
//               </p>
//             </div>
//             <div className="bg-slate-800 rounded-lg p-4">
//               <h3 className="text-sm font-medium text-gray-400">Cancelled Orders</h3>
//               <p className="text-2xl font-bold text-red-400">
//                 {filteredOrderHistory.filter(order => order.status === 'cancelled' || order.status === 'rejected').length}
//               </p>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default Orders;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from './utils/axiosInstance';
import logo from './assets/tradelogo.png';
import { FiRefreshCw } from 'react-icons/fi';
import { useTheme } from './components/ThemeProvider';
import { FaSun, FaMoon } from "react-icons/fa";

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cash, setCash] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open'); // 'open', 'history'
  const [openOrders, setOpenOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [filteredOpenOrders, setFilteredOpenOrders] = useState([]);
  const [filteredOrderHistory, setFilteredOrderHistory] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const { isDark, setIsDark } = useTheme();

  const isActive = (path) => location.pathname === path;

  // Helper function to determine if an order is truly "open"
  const isOrderOpen = (order) => {
    const status = order.status?.toLowerCase();
    return status === 'pending' || status === 'open' || status === 'submitted' || status === 'partial';
  };

  // Helper function to determine if an order is closed/completed
  const isOrderClosed = (order) => {
    const status = order.status?.toLowerCase();
    return status === 'filled' || status === 'executed' || status === 'cancelled' || status === 'rejected';
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/trade/orders/');

      // Get the raw orders from backend
      const rawOpenOrders = response.data.open_orders || [];
      const rawOrderHistory = response.data.order_history || [];

      // Filter open orders to only include truly open orders
      const actualOpenOrders = rawOpenOrders.filter(order => isOrderOpen(order));

      // Combine all closed orders from both arrays (in case backend miscategorizes)
      const allOrders = [...rawOpenOrders, ...rawOrderHistory];
      const actualClosedOrders = allOrders.filter(order => isOrderClosed(order));

      // Remove duplicates from closed orders (in case an order appears in both arrays)
      const uniqueClosedOrders = actualClosedOrders.reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      setOpenOrders(actualOpenOrders);
      setOrderHistory(uniqueClosedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOpenOrders([]);
      setOrderHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch portfolio information
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await axiosInstance.get('/trade/portfolio_information/');
        setCash(parseFloat(response.data.cash || 0));
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      }
    };

    fetchPortfolio();
    fetchOrders();
  }, [fetchOrders]);

  // Filter and sort orders
  useEffect(() => {
    const filterAndSort = (ordersList) => {
      let filtered = [...ordersList];

      // Sort orders
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
          case 'date':
            aValue = new Date(a.created_at || a.timestamp);
            bValue = new Date(b.created_at || b.timestamp);
            break;
          case 'symbol':
            aValue = a.symbol || '';
            bValue = b.symbol || '';
            break;
          case 'quantity':
            aValue = parseFloat(a.quantity || 0);
            bValue = parseFloat(b.quantity || 0);
            break;
          case 'price':
            aValue = parseFloat(a.price || 0);
            bValue = parseFloat(b.price || 0);
            break;
          default:
            aValue = a[sortBy] || '';
            bValue = b[sortBy] || '';
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      return filtered;
    };

    setFilteredOpenOrders(filterAndSort(openOrders));
    setFilteredOrderHistory(filterAndSort(orderHistory));
  }, [openOrders, orderHistory, sortBy, sortOrder]);

  const handleCancelOrder = async (orderId) => {
    try {
      await axiosInstance.delete(`/trade/${orderId}/cancel_order/`);
      fetchOrders(); // Refresh orders after cancellation
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const handleLogout = () => {
    window.location.href = '/';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `£${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'filled':
      case 'executed':
        return 'text-green-500 dark:text-green-400';
      case 'pending':
      case 'open':
      case 'submitted':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'partial':
        return 'text-blue-500 dark:text-blue-400';
      case 'cancelled':
      case 'rejected':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'market':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'limit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
    }
  };

  const getSideColor = (side) => {
    if (side?.toLowerCase() === 'buy') {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    } else {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
  };

  const getOrderCounts = () => {
    return {
      open: openOrders.length,
      history: orderHistory.length
    };
  };

  const orderCounts = getOrderCounts();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header Navigation */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed top-0 w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">EducateTrade</span>
            </div>

            {/* Navigation Links */}
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

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDark(prev => !prev)}
                className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {isDark ? (
                  <FaMoon className="text-gray-300" /> // active dark mode
                ) : (
                  <FaSun className="text-black" /> // active light mode
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

      {/* Main Content */}
      <main className="min-h-screen max-w-[90rem] mx-auto px-4 pt-[80px]">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          {/* <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by symbol, type, or side..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div> */}

          {/* Sort Controls and Refresh */}
          <div className="flex justify-between items-center">
            {/* Left side: Sort controls */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
              >
                <option value="date">Date</option>
                <option value="symbol">Symbol</option>
                <option value="quantity">Quantity</option>
                <option value="price">Price</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* Right side: Refresh button */}
            <button
              onClick={fetchOrders}
              className="flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 mb-6">
          {[
            { key: 'open', label: 'Open Orders', count: orderCounts.open },
            { key: 'history', label: 'Order History', count: orderCounts.history }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-md transition-colors ${activeTab === key
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <span className="font-medium">{label}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${activeTab === key
                ? 'bg-blue-700 dark:bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Orders Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
            </div>
          ) : (
            <>
              {/* Open Orders Tab */}
              {activeTab === 'open' && (
                <>
                  {filteredOpenOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <p className="text-lg">No open orders</p>
                      <p className="text-sm mt-2">
                        Your open orders will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Date/Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Symbol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Side
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Order Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Limit Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredOpenOrders.map((order, index) => (
                            <tr key={order.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {formatDate(order.created_at || order.timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {order.symbol}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSideColor(order.side)}`}>
                                  {order.side?.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(order.order_type || order.type)}`}>
                                  {(order.order_type || order.type)?.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {order.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {formatCurrency(order.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {order.limit_price ? formatCurrency(order.limit_price) : '--'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`${getStatusColor(order.status)} font-medium`}>
                                  {order.status?.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Order History Tab */}
              {activeTab === 'history' && (
                <>
                  {filteredOrderHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <p className="text-lg">No order history</p>
                      <p className="text-sm mt-2">
                        Your completed orders will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Date/Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Symbol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Side
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Order Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Total Value
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredOrderHistory.map((order, index) => (
                            <tr key={order.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {formatDate(order.created_at || order.timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {order.symbol}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSideColor(order.side)}`}>
                                  {order.side?.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(order.order_type || order.type)}`}>
                                  {(order.order_type || order.type)?.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {order.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {formatCurrency(order.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {formatCurrency((parseFloat(order.quantity || 0) * parseFloat(order.price || 0)))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`${getStatusColor(order.status)} font-medium`}>
                                  {order.status?.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Summary Stats */}
        {(filteredOpenOrders.length > 0 || filteredOrderHistory.length > 0) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredOpenOrders.length + filteredOrderHistory.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Orders</h3>
              <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">
                {filteredOpenOrders.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Filled Orders</h3>
              <p className="text-2xl font-bold text-green-500 dark:text-green-400">
                {filteredOrderHistory.filter(order => order.status === 'filled' || order.status === 'executed').length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cancelled Orders</h3>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400">
                {filteredOrderHistory.filter(order => order.status === 'cancelled' || order.status === 'rejected').length}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;