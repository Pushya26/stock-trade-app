// App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ThemeProvider from './components/ThemeProvider';
import Login from './Login';
import Portfolio from './Portfolio';
import ForgotPassword from './forgotPassword';
import ResetPassword from './ResetPassword';
import Trade from './Trade';
import Research from './Research';
import Orders from './Orders';
import Register from './Register';
import Home from './Home';
import News from './news/News';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/research" element={<Research />} />
          <Route path="/news" element={<News />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
