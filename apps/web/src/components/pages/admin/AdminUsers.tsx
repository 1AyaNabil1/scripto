/**
 * Admin Users Management - View and manage all users
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Trash2, 
  Shield, 
  ShieldOff, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  AlertTriangle,
  X,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { adminApiClient } from '../../../lib/adminApi';
import type { AdminUser, AdminStory } from '../../../lib/adminApi';
import SEO from '../../common/SEO';

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthContext();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  // Modal states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userStories, setUserStories] = useState<AdminStory[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!currentUser?.isAdmin) {
      navigate('/');
      return;
    }
  }, [currentUser, navigate]);

  // Load users
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApiClient.getAllUsers(pagination.limit, pagination.offset);
      setUsers(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        hasMore: response.hasMore,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit, pagination.offset]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter users by search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination handlers
  const handlePrevPage = () => {
    setPagination(prev => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }));
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  // View user details
  const handleViewUser = async (user: AdminUser) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
    try {
      const details = await adminApiClient.getUserDetails(user.id);
      setUserStories(details.stories);
    } catch (err) {
      console.error('Failed to load user stories:', err);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await adminApiClient.deleteUser(selectedUser.id);
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update user role
  const handleUpdateRole = async (newRole: 'user' | 'admin' | 'superadmin') => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const isAdmin = newRole !== 'user';
      const response = await adminApiClient.updateUserRole(selectedUser.id, isAdmin, newRole);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? response.user : u));
      setIsRoleModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser?.isAdmin) {
    return null;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const RoleBadge = ({ role, isAdmin }: { role: string; isAdmin: boolean }) => {
    const colors = {
      superadmin: 'bg-red-100 text-red-800 border-red-200',
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      user: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[role as keyof typeof colors] || colors.user}`}>
        {isAdmin && <Shield className="w-3 h-3 inline mr-1" />}
        {role}
      </span>
    );
  };

  return (
    <>
      <SEO 
        title="Manage Users | Admin Dashboard"
        description="Admin user management panel"
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link 
              to="/admin" 
              className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8" />
                <h1 className="text-2xl font-bold">Manage Users</h1>
              </div>
              <button
                onClick={loadUsers}
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
          {/* Search and Stats */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="text-sm text-gray-500">
                Showing {filteredUsers.length} of {pagination.total} users
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <p className="text-red-800">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Today</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={user.role} isAdmin={user.isAdmin} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.isAdmin ? '∞' : user.dailyUsageCount}/3
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.isEmailVerified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.isEmailVerified ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedUser(user); setIsRoleModalOpen(true); }}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Change Role"
                              disabled={user.id === currentUser?.id}
                            >
                              {user.isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => { setSelectedUser(user); setIsDeleteModalOpen(true); }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                              disabled={user.id === currentUser?.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.offset === 0}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasMore}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Details Modal */}
        <AnimatePresence>
          {isUserModalOpen && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setIsUserModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                    <button
                      onClick={() => setIsUserModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-sm text-gray-500">Name</label>
                      <p className="font-medium">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Role</label>
                      <p><RoleBadge role={selectedUser.role} isAdmin={selectedUser.isAdmin} /></p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Joined</label>
                      <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">User's Stories ({userStories.length})</h3>
                    {userStories.length === 0 ? (
                      <p className="text-gray-500 text-sm">No stories found</p>
                    ) : (
                      <div className="space-y-2">
                        {userStories.map(story => (
                          <div key={story.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium">{story.title}</p>
                              <p className="text-sm text-gray-500">{story.totalFrames} frames • {story.isPublic ? 'Public' : 'Private'}</p>
                            </div>
                            <Link
                              to={`/stories/${story.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {isDeleteModalOpen && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 text-red-600 mb-4">
                  <AlertTriangle className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Delete User</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>{selectedUser.name}</strong> ({selectedUser.email})? 
                  This action cannot be undone and will delete all their stories.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Deleting...' : 'Delete User'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Role Update Modal */}
        <AnimatePresence>
          {isRoleModalOpen && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setIsRoleModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 text-purple-600 mb-4">
                  <Shield className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Update Role</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Change role for <strong>{selectedUser.name}</strong>
                </p>
                <div className="space-y-3 mb-6">
                  {(['user', 'admin', 'superadmin'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => handleUpdateRole(role)}
                      disabled={isSubmitting || (role !== 'user' && currentUser?.role !== 'superadmin')}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedUser.role === role 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${(role !== 'user' && currentUser?.role !== 'superadmin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-medium capitalize">{role}</div>
                      <div className="text-sm text-gray-500">
                        {role === 'user' && 'Standard user with limited daily usage'}
                        {role === 'admin' && 'Can manage users and stories'}
                        {role === 'superadmin' && 'Full access including admin management'}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsRoleModalOpen(false)}
                  className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default AdminUsers;
