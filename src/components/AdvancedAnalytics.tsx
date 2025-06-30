import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, MapPin, Calendar, Download, Filter, RefreshCw, Target, Zap, Activity, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getSignals, getEvents } from '../lib/supabase';

interface AnalyticsData {
  signalTrends: any[];
  severityDistribution: any[];
  locationHotspots: any[];
  typeBreakdown: any[];
  timePatterns: any[];
  riskAssessment: any[];
}

const AdvancedAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('signals');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [signalsResult, eventsResult] = await Promise.all([
        getSignals(),
        getEvents()
      ]);

      const signals = signalsResult.data || [];
      const events = eventsResult.data || [];

      // Generate signal trends over time
      const signalTrends = generateSignalTrends(signals, timeRange);
      
      // Calculate severity distribution
      const severityDistribution = [
        { severity: 'High', count: signals.filter(s => s.severity === 'high').length, color: '#ef4444' },
        { severity: 'Medium', count: signals.filter(s => s.severity === 'medium').length, color: '#f59e0b' },
        { severity: 'Low', count: signals.filter(s => s.severity === 'low').length, color: '#10b981' }
      ];

      // Generate location hotspots
      const locationCounts = {};
      signals.forEach(signal => {
        const location = signal.location.split(',')[0];
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      });
      
      const locationHotspots = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count, risk: count > 10 ? 'high' : count > 5 ? 'medium' : 'low' }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Signal type breakdown
      const typeCounts = {};
      signals.forEach(signal => {
        typeCounts[signal.type] = (typeCounts[signal.type] || 0) + 1;
      });
      
      const typeBreakdown = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count, percentage: Math.round((count / signals.length) * 100) }))
        .sort((a, b) => b.count - a.count);

      // Time patterns (hourly distribution)
      const timePatterns = generateTimePatterns(signals);

      // Risk assessment radar
      const riskAssessment = [
        { factor: 'Signal Volume', value: Math.min(100, (signals.length / 100) * 100) },
        { factor: 'Severity Level', value: (severityDistribution[0].count / signals.length) * 100 },
        { factor: 'Geographic Spread', value: Math.min(100, Object.keys(locationCounts).length * 10) },
        { factor: 'Event Frequency', value: Math.min(100, events.length * 5) },
        { factor: 'Response Time', value: 85 },
        { factor: 'Community Engagement', value: 70 }
      ];

      setAnalyticsData({
        signalTrends,
        severityDistribution,
        locationHotspots,
        typeBreakdown,
        timePatterns,
        riskAssessment
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSignalTrends = (signals: any[], range: string) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 1;
    const trends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySignals = signals.filter(signal => 
        signal.created_at.startsWith(dateStr)
      );
      
      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        signals: daySignals.length,
        high: daySignals.filter(s => s.severity === 'high').length,
        medium: daySignals.filter(s => s.severity === 'medium').length,
        low: daySignals.filter(s => s.severity === 'low').length,
        anomaly: Math.random() * 0.3 + 0.1 // Simulated anomaly score
      });
    }
    
    return trends;
  };

  const generateTimePatterns = (signals: any[]) => {
    const hourCounts = Array(24).fill(0);
    
    signals.forEach(signal => {
      const hour = new Date(signal.created_at).getHours();
      hourCounts[hour]++;
    });
    
    return hourCounts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      signals: count,
      normalized: count / Math.max(...hourCounts) * 100
    }));
  };

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span>Advanced Analytics</span>
            </h2>
            <p className="text-gray-600">Comprehensive insights into health signal patterns and trends</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <button
              onClick={loadAnalyticsData}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {analyticsData?.signalTrends.reduce((sum, day) => sum + day.signals, 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Total Signals</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {analyticsData?.severityDistribution.find(s => s.severity === 'High')?.count || 0}
              </div>
              <div className="text-sm text-gray-600">High Severity</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {analyticsData?.locationHotspots.length || 0}
              </div>
              <div className="text-sm text-gray-600">Active Locations</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">94%</div>
              <div className="text-sm text-gray-600">Detection Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Signal Trends */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Signal Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData?.signalTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="signals" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Area type="monotone" dataKey="high" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData?.severityDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                label={({ severity, count }) => `${severity}: ${count}`}
              >
                {analyticsData?.severityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Location Hotspots */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Location Hotspots</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData?.locationHotspots.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Assessment Radar */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Assessment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={analyticsData?.riskAssessment}>
              <PolarGrid />
              <PolarAngleAxis dataKey="factor" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Risk Level"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time Patterns */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4">24-Hour Signal Patterns</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={analyticsData?.timePatterns}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="signals" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Signal Type Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Signal Type Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyticsData?.typeBreakdown.map((type, index) => (
            <div key={type.type} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{type.type}</h4>
                <span className="text-sm text-gray-500">{type.percentage}%</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${type.percentage}%` }}
                  ></div>
                </div>
                <span className="text-lg font-bold text-gray-900">{type.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;