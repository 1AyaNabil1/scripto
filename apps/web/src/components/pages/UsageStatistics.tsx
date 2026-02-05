import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Clock, Image as ImageIcon, Award } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import SEO from '../common/SEO';
import { apiClient } from '../../lib/utils';

interface UsageData {
  totalStories: number;
  totalImages: number;
  totalTimeSpent: number; // in minutes
  dailyAverage: number;
  weeklyActivity: { day: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
  achievements: { title: string; description: string; unlockedAt: string }[];
}

const UsageStatistics: React.FC = () => {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await apiClient.getUserStatistics(user.id);
        setStats(data);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        // Set default empty stats on error
        setStats({
          totalStories: 0,
          totalImages: 0,
          totalTimeSpent: 0,
          dailyAverage: 0,
          weeklyActivity: [
            { day: 'Mon', count: 0 },
            { day: 'Tue', count: 0 },
            { day: 'Wed', count: 0 },
            { day: 'Thu', count: 0 },
            { day: 'Fri', count: 0 },
            { day: 'Sat', count: 0 },
            { day: 'Sun', count: 0 },
          ],
          monthlyTrend: [
            { month: 'Jan', count: 0 },
            { month: 'Feb', count: 0 },
            { month: 'Mar', count: 0 },
            { month: 'Apr', count: 0 },
            { month: 'May', count: 0 },
            { month: 'Jun', count: 0 },
          ],
          achievements: [],
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStatistics();
  }, [user?.id]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const maxActivityCount = Math.max(
    ...(selectedPeriod === 'week' 
      ? stats?.weeklyActivity.map(d => d.count) || [1]
      : stats?.monthlyTrend.map(d => d.count) || [1]
    )
  );

  return (
    <>
      <SEO 
        title="Usage Statistics | Scripto"
        description="View your Scripto usage statistics and activity"
      />
      
      <div className="min-h-screen bg-stone-50">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center mb-6">
              <BarChart3 className="w-16 h-16" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-center">
              Usage Statistics
            </h1>
            <p className="text-lg text-blue-100 text-center max-w-2xl mx-auto">
              Track your creative journey and productivity
            </p>
          </div>
        </motion.div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                    <div className="h-12 w-12 bg-stone-200 rounded-lg mb-4" />
                    <div className="h-8 bg-stone-200 rounded mb-2" />
                    <div className="h-4 bg-stone-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {!isLoading && stats && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              >
                {/* Total Stories */}
                <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-stone-800 mb-1">
                    {stats.totalStories}
                  </h3>
                  <p className="text-stone-600 text-sm">Total Stories</p>
                </div>

                {/* Total Images */}
                <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <ImageIcon className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-stone-800 mb-1">
                    {stats.totalImages}
                  </h3>
                  <p className="text-stone-600 text-sm">Images Generated</p>
                </div>

                {/* Time Spent */}
                <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-stone-800 mb-1">
                    {formatTime(stats.totalTimeSpent)}
                  </h3>
                  <p className="text-stone-600 text-sm">Time Creating</p>
                </div>

                {/* Daily Average */}
                <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-stone-800 mb-1">
                    {stats.dailyAverage}
                  </h3>
                  <p className="text-stone-600 text-sm">Daily Average</p>
                </div>
              </motion.div>

              {/* Activity Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-stone-800">Activity</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedPeriod('week')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedPeriod === 'week'
                          ? 'bg-blue-600 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setSelectedPeriod('month')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedPeriod === 'month'
                          ? 'bg-blue-600 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Month
                    </button>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="h-64 flex items-end justify-between gap-2">
                  {(selectedPeriod === 'week' ? stats.weeklyActivity : stats.monthlyTrend).map((item, index) => {
                    const height = maxActivityCount > 0 ? (item.count / maxActivityCount) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col items-center justify-end h-52">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-lg min-h-[4px] relative group"
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-stone-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.count} stories
                            </div>
                          </motion.div>
                        </div>
                        <span className="text-xs text-stone-600 font-medium">
                          {selectedPeriod === 'week' ? item.day : item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Achievements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-8 h-8 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-stone-800">Achievements</h2>
                </div>

                {stats.achievements.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-600">
                      No achievements yet. Keep creating to unlock rewards!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200"
                      >
                        <Award className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                        <div>
                          <h3 className="font-bold text-stone-800 mb-1">
                            {achievement.title}
                          </h3>
                          <p className="text-sm text-stone-600 mb-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-stone-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default UsageStatistics;
