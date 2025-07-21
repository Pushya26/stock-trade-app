import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  AcademicCapIcon,
  TrophyIcon,
  ShieldCheckIcon,
  GlobeEuropeAfricaIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
 
const sectionFade = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }
};
 
const HomePage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="Logo" className="w-8 h-8" />
              <span className="text-2xl font-bold text-blue-600">EducateTrade Simulator</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
 
      {/* Hero Section */}
      <motion.section
        id="hero"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionFade}
        className="relative overflow-hidden flex-1 pt-16"
      >
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">EducateTrade</span>{' '}
                  <span className="block text-blue-600 xl:inline">Stock Trading</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Learn to trade UK stocks with real market data in a risk-free environment.
                  Perfect for students, educators, and aspiring investors to build trading skills.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                    >
                      Start Trading Now
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    {/* <Link
                      to="/login"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                    >
                      Demo Account
                    </Link> */}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 flex items-center justify-center">
          <div
            className="w-full"
            style={{
              maxWidth: '34rem',
              height: '32rem',
              background: 'linear-gradient(to right, #3b82f6, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 0
            }}
          >
            <ChartBarIcon className="h-32 w-32 text-white opacity-20" />
          </div>
        </div>
      </motion.section>
 
      {/* Features Section */}
      <motion.section
        id="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionFade}
        className="py-12 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to learn trading
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our platform provides real market conditions with educational support to help you become a confident trader.
            </p>
          </div>
 
          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <FeatureCard
                icon={<ChartBarIcon className="h-6 w-6" />}
                title="Real UK Market Data"
                description="Trade with live data from LSE, AIM, and FTSE indices. Experience real market conditions with realistic pricing and volatility."
              />
              <FeatureCard
                icon={<AcademicCapIcon className="h-6 w-6" />}
                title="Educational Content"
                description="Learn about UK financial markets, ISAs, SIPPs, and investment strategies through interactive modules and tutorials."
              />
              <FeatureCard
                icon={<TrophyIcon className="h-6 w-6" />}
                title="Trading Competitions"
                description="Compete with other traders in real-time competitions. Test your skills and learn from the community."
              />
              <FeatureCard
                icon={<ShieldCheckIcon className="h-6 w-6" />}
                title="Risk-Free Environment"
                description="Practice trading without financial risk. Perfect your strategies before investing real money."
              />
              <FeatureCard
                icon={<GlobeEuropeAfricaIcon className="h-6 w-6" />}
                title="UK-Focused Platform"
                description="Specialized for UK markets with proper regulations, fees, and tax considerations built-in."
              />
              <FeatureCard
                icon={<SparklesIcon className="h-6 w-6" />}
                title="Advanced Analytics"
                description="Track your performance with detailed analytics, risk metrics, and portfolio optimization tools."
              />
            </div>
          </div>
        </div>
      </motion.section>
 
      {/* CTA Section */}
      <motion.section
        id="cta"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionFade}
        className="bg-blue-700"
      >
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to start trading?</span>
            <span className="block">Join thousands of users today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            Start with £100000 virtual money and experience real UK market trading.
          </p>
          <Link
            to="/register"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 sm:w-auto"
          >
            Create Free Account
          </Link>
        </div>
      </motion.section>
 
      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link to="/privacy-policy" className="text-gray-400 hover:text-gray-500">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-gray-500">Terms of Service</Link>
            <Link to="/support" className="text-gray-400 hover:text-gray-500">Support</Link>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; {new Date().getFullYear()} EducateTrade Simulator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="relative">
    <div>
      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
        {icon}
      </div>
      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{title}</p>
    </div>
    <div className="mt-2 ml-16 text-base text-gray-500">
      {description}
    </div>
  </div>
);

FeatureCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};
 
export default HomePage;