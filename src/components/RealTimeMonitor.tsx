import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Zap, AlertTriangle, TrendingUp, Clock, MapPin, Pause, Play, Settings } from 'lucide-react';
import { getSignals, getEvents } from '../lib/supabase';

interface SignalUpdate {
  id: string;
  type: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  isNew?: boolean;
}

interface SystemStatus {
  isConnected: boolean;
  lastUpdate: string;
  signalsPerMinute: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

const RealTimeMonitor: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [recentSignals, setRecentSignals] = useState<SignalUpdate[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isConnected: true,
    lastUpdate: new Date().toISOString(),
    signalsPerMinute: 0,
    systemHealth: 'healthy'
  });
  const [stats, setStats] = useState({
    totalToday: 0,
    highSeverity: 0,
    activeEvents: 0,
    avgResponseTime: '2.3s'
  });

  useEffect(() => {
    loadInitialData();
    
    if (isMonitoring) {
      const interval = setInterval(() => {
        simulateRealTimeUpdate();
      }, 3000); // Update every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const loadInitialData = async () => {
    try {
      const [signalsResult, eventsResult] = await Promise.all([
        getSignals(),
        getEvents()
      ]);

      const signals = signalsResult.data || [];
      const events = eventsResult.data || [];

      // Get recent signals (last 10)
      const recent = signals
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(signal => ({
          id: signal.id,
          type: signal.type,
          location: signal.location,
          severity: signal.severity as 'low' | 'medium' | 'high',
          timestamp: signal.created_at
        }));

      setRecentSignals(recent);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todaySignals = signals.filter(s => s.created_at.startsWith(today));
      
      setStats({
        totalToday: todaySignals.length,
        highSeverity: signals.filter(s => s.severity === 'high').length,
        activeEvents: events.filter(e => e.status === 'active').length,
        avgResponseTime: '2.3s'
      });

      setSystemStatus(prev => ({
        ...prev,
        lastUpdate: new Date().toISOString(),
        signalsPerMinute: Math.floor(Math.random() * 5) + 1
      }));
    } catch (error) {
      console.error('Error loading real-time data:', error);
      setSystemStatus(prev => ({
        ...prev,
        isConnected: false,
        systemHealth: 'critical'
      }));
    }
  };

  const simulateRealTimeUpdate = () => {
    // Simulate new signal arrival
    if (Math.random() > 0.7) { // 30% chance of new signal
      const newSignal: SignalUpdate = {
        id: `signal-${Date.now()}`,
        type: ['Cough', 'Fever', 'Respiratory', 'Environmental'][Math.floor(Math.random() * 4)],
        location: ['Mumbai, Andheri', 'Delhi, Central', 'Bangalore, Tech Park', 'Chennai, T Nagar'][Math.floor(Math.random() * 4)],
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        timestamp: new Date().toISOString(),
        isNew: true
      };

      setRecentSignals(prev => [newSignal, ...prev.slice(0, 9)]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalToday: prev.totalToday + 1,
        highSeverity: newSignal.severity === 'high' ? prev.highSeverity + 1 : prev.highSeverity
      }));

      // Remove new flag after animation
      setTimeout(() => {
        setRecentSignals(prev => 
          prev.map(signal => 
            signal.id === newSignal.id ? { ...signal, isNew: false } : signal
          )
        );
      }, 2000);
    }

    // Update system status
    setSystemStatus(prev => ({
      ...prev,
      lastUpdate: new Date().toISOString(),
      signalsPerMinute: Math.floor(Math.random() * 8) + 1,
      systemHealth: Math.random() > 0.9 ? 'warning' : 'healthy'
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {systemStatus.isConnected ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${systemStatus.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {systemStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Activity className={`h-5 w-5 ${getSystemHealthColor(systemStatus.systemHealth)}`} />
              <span className={`font-medium ${getSystemHealthColor(systemStatus.systemHealth)}`}>
                System {systemStatus.systemHealth}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                Last update: {new Date(systemStatus.lastUpdate).toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              {systemStatus.signalsPerMinute} signals/min
            </div>
            
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`p-2 rounded-lg transition-colors ${
                isMonitoring 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              {isMonitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalToday}</div>
              <div className="text-sm text-gray-600">Signals Today</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.highSeverity}</div>
              <div className="text-sm text-gray-600">High Severity</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeEvents}</div>
              <div className="text-sm text-gray-600">Active Events</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Signal Feed */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Live Signal Feed</span>
            {isMonitoring && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </h3>
          
          <div className="text-sm text-gray-600">
            {recentSignals.length} recent signals
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {recentSignals.map((signal) => (
            <div
              key={signal.id}
              className={`p-4 rounded-lg border transition-all duration-500 ${
                signal.isNew 
                  ? 'border-blue-500 bg-blue-50 scale-105' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(signal.severity)}`}>
                    {signal.severity.toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{signal.type}</span>
                  {signal.isNew && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full animate-pulse">
                      NEW
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{signal.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {recentSignals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent signals</p>
              <p className="text-sm">Monitoring for new activity...</p>
            </div>
          )}
        </div>
      </div>

      {/* System Performance */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4">System Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">99.8%</div>
            <div className="text-sm text-gray-600">Uptime</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.8%' }}></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">1.2s</div>
            <div className="text-sm text-gray-600">Avg Latency</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">94%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '94%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitor;