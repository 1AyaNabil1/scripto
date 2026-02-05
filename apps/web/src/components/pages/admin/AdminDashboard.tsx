/**
 * Admin Dashboard - Main admin panel with statistics and quick actions
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, BookOpen, Eye, EyeOff, Shield, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { adminApiClient } from '../../../lib/adminApi';
import type { AdminStats } from '../../../lib/adminApi';
import SEO from '../../common/SEO';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check admin access
  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // Load stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.isAdmin) {
    return null;
  }

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color, 
    link 
  }: { 
    icon: React.ElementType; 
    label: string; 
    value: number | string; 
    color: string; 
    link?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? '...' : value}
          </p>
        </div>
        <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('border-', 'bg-')}`}>
          <Icon className={`w-6 h-6 ${color.replace('border-', 'text-')}`} />
        </div>
      </div>
      {link && (
        <Link 
          to={link}
          className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          View all <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      )}
    </motion.div>
  );

  const QuickAction = ({ 
    icon: Icon, 
    label, 
    description, 
    link, 
    color 
  }: { 
    icon: React.ElementType; 
    label: string; 
    description: string; 
    link: string; 
    color: string; 
  }) => (
    <Link to={link}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border border-gray-100"
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );

  return (
    <>
      <SEO 
        title="Admin Dashboard | Scripto"
        description="Admin dashboard for managing users and stories"
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-8 h-8" />
                  <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                </div>
                <p className="text-white/80">
                  Welcome back, {user.name}! You're logged in as {user.role}.
                </p>
              </div>
              <button
                onClick={loadStats}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats?.totalUsers ?? 0}
              color="border-blue-500"
              link="/admin/users"
            />
            <StatCard
              icon={BookOpen}
              label="Total Stories"
              value={stats?.totalStories ?? 0}
              color="border-purple-500"
              link="/admin/stories"
            />
            <StatCard
              icon={Eye}
              label="Public Stories"
              value={stats?.publicStories ?? 0}
              color="border-green-500"
              link="/admin/stories?filter=public"
            />
            <StatCard
              icon={EyeOff}
              label="Private Stories"
              value={stats?.privateStories ?? 0}
              color="border-orange-500"
              link="/admin/stories?filter=private"
            />
          </div>

          {/* Quick Actions */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <QuickAction
              icon={Users}
              label="Manage Users"
              description="View, edit, and manage user accounts and roles"
              link="/admin/users"
              color="bg-blue-500"
            />
            <QuickAction
              icon={BookOpen}
              label="Manage Stories"
              description="View, delete, and moderate all stories in the gallery"
              link="/admin/stories"
              color="bg-purple-500"
            />
            <QuickAction
              icon={Eye}
              label="View Gallery"
              description="Browse the public gallery with admin controls"
              link="/gallery"
              color="bg-green-500"
            />
          </div>

          {/* Admin Info */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 font-medium">{user.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Role:</span>
                <span className="ml-2 font-medium capitalize">{user.role}</span>
              </div>
              <div>
                <span className="text-gray-500">Admin Status:</span>
                <span className="ml-2 font-medium text-green-600">Active</span>
              </div>
              <div>
                <span className="text-gray-500">Access Level:</span>
                <span className="ml-2 font-medium">
                  {user.role === 'superadmin' ? 'Full Access' : 'Standard Admin'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
