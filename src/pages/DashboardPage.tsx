import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, User, MapPin, TrendingUp, AlertTriangle, Calendar, Filter, Bot, Activity, Zap, Shield, Clock, ChevronRight, Eye, Download, BarChart3, Plus, RefreshCw, Sparkles, CheckCircle, Mail, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import MapComponent from '../components/MapComponent';
import EventCard from '../components/EventCard';
import AIChat from '../components/AIChat';
import NotificationCenter from '../components/NotificationCenter';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import RealTimeMonitor from '../components/RealTimeMonitor';
import { getSignals, getCurrentUser, getUserProfile, getEvents, checkEmailVerification, resendEmailVerification } from '../lib/supabase';
import { generateHealthReport } from '../lib/openai';

const DashboardPage = () => {
  const [selectedDate, setSelectedDate] = useState('2025-06-28');
  const [timeFilter, setTimeFilter] = useState('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAIChat, setShowAIChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [signals, setSignals] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredSignals, setFilteredSignals] = useState([]);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiReport, setAiReport] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'monitor', name: 'Live Monitor', icon: Activity },
    { id: 'map', name: 'Map View', icon: MapPin }
  ];

  const metricCards = [
    {
      title: 'Total Active Signals',
      value: signals.length.toString(),
      change: '+5%',
      trend: 'up',
      description: 'Signals detected in the last 24h',
      icon: Activity
    },
    {
      title: 'Active Events',
      value: events.filter(e => e.status === 'active').length.toString(),
      change: '+2',
      trend: 'up',
      description: 'Cluster events generated',
      icon: AlertTriangle
    },
    {
      title: 'Average Severity',
      value: 'Moderate',
      change: 'Stable',
      trend: 'stable',
      description: 'Across all active events',
      icon: BarChart3
    },
    {
      title: 'High Severity Signals',
      value: signals.filter(s => s.severity === 'high').length.toString(),
      change: '-1',
      trend: 'down',
      description: 'Requiring expert review',
      icon: Eye
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'New event created from signal cluster',
      time: '5 minutes ago',
      type: 'event',
      user: 'AI System',
      icon: Zap
    },
    {
      id: 2,
      action: 'High severity signal detected',
      time: '15 minutes ago',
      type: 'signal',
      user: 'Monitoring System',
      icon: Activity
    },
    {
      id: 3,
      action: 'Event #34 updated with new signals',
      time: '1 hour ago',
      type: 'event',
      user: 'AI Engine',
      icon: Zap
    },
    {
      id: 4,
      action: 'Weekly trend analysis completed',
      time: '2 hours ago',
      type: 'report',
      user: 'System',
      icon: BarChart3
    }
  ];

  // Load user data and signals on component mount
  useEffect(() => {
    loadUserData();
    loadData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter signals when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = signals.filter(signal => 
        signal.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        signal.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSignals(filtered);
    } else {
      setFilteredSignals([]);
    }
  }, [searchTerm, signals]);

  const loadUserData = async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Check email verification
        const { verified } = await checkEmailVerification();
        setEmailVerified(verified);
        setShowEmailVerification(!verified);
        
        const { data: profile } = await getUserProfile(currentUser.id);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadData = async () => {
    try {
      const [signalsResult, eventsResult] = await Promise.all([
        getSignals(),
        getEvents()
      ]);
      
      if (signalsResult.data) {
        setSignals(signalsResult.data);
      }
      
      if (eventsResult.data) {
        setEvents(eventsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIHealthReport = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await generateHealthReport(signals, events);
      setAiReport(report);
    } catch (error) {
      console.error('Error generating AI report:', error);
      setAiReport('Unable to generate health report at this time. Please try again later.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const { error } = await resendEmailVerification();
      if (!error) {
        alert('Verification email sent! Please check your inbox.');
      } else {
        alert('Error sending verification email: ' + error.message);
      }
    } catch (error) {
      alert('Error sending verification email');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // Combine real signals with events for map display
  const mapSignals = [
    ...signals.map(signal => ({
      id: signal.id,
      lat: signal.latitude || 20.5937,
      lng: signal.longitude || 78.9629,
      type: signal.type,
      severity: signal.severity as 'low' | 'medium' | 'high',
      location: signal.location,
      timestamp: signal.created_at
    }))
  ];

  const getUserDisplayName = () => {
    if (userProfile?.username) {
      return userProfile.username;
    }
    if (userProfile?.full_name) {
      return userProfile.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const activeEvents = events.filter(e => e.status === 'active').slice(0, 6);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <AdvancedAnalytics />;
      case 'monitor':
        return <RealTimeMonitor />;
      case 'map':
        return (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Interactive Signal Map</h3>
            <MapComponent 
              signals={mapSignals}
              height="600px"
              center={[20.5937, 78.9629]}
              zoom={5}
            />
          </div>
        );
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* AI Health Report */}
      {aiReport && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border border-purple-200">
          <div className="flex items-center space-x-3 mb-4">
            <Bot className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">AI Health Intelligence Report</h3>
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div className="prose prose-sm max-w-none text-gray-700">
            <div className="whitespace-pre-wrap">{aiReport}</div>
          </div>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Map */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Live Signal Map</h2>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium">
                  Signals
                </button>
                <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">
                  Events
                </button>
                <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">
                  Clusters
                </button>
              </div>
            </div>
            
            {/* Map */}
            <div className="relative" style={{ zIndex: 1 }}>
              <MapComponent 
                signals={mapSignals}
                height="400px"
                center={[20.5937, 78.9629]}
                zoom={5}
                className="z-0"
              />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">High Severity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">Medium</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Low</span>
                </div>
              </div>
              <button className="text-blue-600 font-medium hover:text-blue-700 text-sm">
                View Full Map →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Metrics and Activity */}
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            {metricCards.map((metric, index) => (
              <div key={index} className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{metric.title}</h3>
                  <metric.icon className={`h-4 w-4 ${getTrendColor(metric.trend)}`} />
                </div>
                <div className="flex items-end space-x-2 mb-1">
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">{metric.value}</span>
                  <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                    {metric.change}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{metric.description}</p>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Recent Activity</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <activity.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{activity.time}</span>
                      <span>•</span>
                      <span>{activity.user}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Active Events & Clusters</h2>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option>All Severities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <Link
              to="/admin"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Signal</span>
            </Link>
          </div>
        </div>

        {activeEvents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No active events</h3>
            <p className="text-gray-600">The system is monitoring for health signals. Events will appear here when clusters are detected.</p>
          </div>
        )}
      </div>

      {/* Alert Panel */}
      {events.filter(e => e.status === 'active' && e.severity === 'high').length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-red-900 mb-2">High Severity Alert</h3>
              <p className="text-red-800 mb-4">
                {events.filter(e => e.status === 'active' && e.severity === 'high').length} high severity event(s) detected. 
                Monitor closely and follow recommended precautionary measures.
              </p>
              <Link
                to="/alerts"
                className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                View All Alerts
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Email Verification Banner */}
      {showEmailVerification && !emailVerified && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-yellow-800 font-medium">Please verify your email address</p>
                  <p className="text-yellow-700 text-sm">Check your inbox for a verification link to access all features.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleResendVerification}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                >
                  Resend Email
                </button>
                <button
                  onClick={() => setShowEmailVerification(false)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left - Greeting */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Good Morning, {getUserDisplayName()}
                {!emailVerified && (
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Email Pending
                  </span>
                )}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">Here's an overview of recent disease signals and clusters detected.</p>
            </div>

            {/* Right - Search and Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by city, event, signal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowNotifications(true)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {events.filter(e => e.status === 'active' && e.severity === 'high').length}
                  </span>
                </button>
                
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Settings className="h-6 w-6" />
                </button>
                
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900 hidden sm:inline">{getUserDisplayName()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchTerm && (
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Search Results for "{searchTerm}" ({filteredSignals.length} found)
            </h3>
            {filteredSignals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSignals.map((signal) => (
                  <div key={signal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{signal.type} Signal</h4>
                      <span className={`w-3 h-3 rounded-full ${getSeverityColor(signal.severity)}`}></span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{signal.location}</p>
                    <p className="text-gray-500 text-xs">{new Date(signal.created_at).toLocaleString()}</p>
                    {signal.notes && (
                      <p className="text-gray-600 text-sm mt-2">{signal.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No signals found matching your search.</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center bg-white rounded-lg border border-gray-300 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={loadData}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button 
              onClick={generateAIHealthReport}
              disabled={isGeneratingReport}
              className="px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
            >
              {isGeneratingReport ? (
                <Sparkles className="h-4 w-4 animate-spin" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{isGeneratingReport ? 'Generating...' : 'AI Report'}</span>
              <span className="sm:hidden">{isGeneratingReport ? '...' : 'AI'}</span>
            </button>
            <button className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Generate Report</span>
              <span className="sm:hidden">Report</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* Panpath AI Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setShowAIChat(!showAIChat)}
          className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative"
        >
          <Bot className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
        </button>
      </div>

      <AIChat 
        isOpen={showAIChat} 
        onClose={() => setShowAIChat(false)}
        context={{
          signalCount: signals.length,
          eventCount: events.filter(e => e.status === 'active').length,
          recentActivity: signals.length > 0 ? 'Active monitoring' : 'Normal monitoring'
        }}
      />

      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
};

export default DashboardPage;