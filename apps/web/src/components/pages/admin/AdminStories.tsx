/**
 * Admin Stories Management - View and manage all stories including private ones
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Trash2, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  X,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
  Filter
} from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { adminApiClient } from '../../../lib/adminApi';
import type { AdminStory } from '../../../lib/adminApi';
import SEO from '../../common/SEO';

const AdminStories: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuthContext();
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>(
    (searchParams.get('filter') as 'all' | 'public' | 'private') || 'all'
  );
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  // Modal states
  const [selectedStory, setSelectedStory] = useState<AdminStory | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!currentUser?.isAdmin) {
      navigate('/');
      return;
    }
  }, [currentUser, navigate]);

  // Load stories
  const loadStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApiClient.getAllStories(pagination.limit, pagination.offset, true);
      setStories(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        hasMore: response.hasMore,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit, pagination.offset]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // Filter stories
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const matchesSearch = 
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesVisibility = 
        visibilityFilter === 'all' ||
        (visibilityFilter === 'public' && story.isPublic) ||
        (visibilityFilter === 'private' && !story.isPublic);
      
      return matchesSearch && matchesVisibility;
    });
  }, [stories, searchQuery, visibilityFilter]);

  // Update URL when filter changes
  useEffect(() => {
    if (visibilityFilter !== 'all') {
      setSearchParams({ filter: visibilityFilter });
    } else {
      setSearchParams({});
    }
  }, [visibilityFilter, setSearchParams]);

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

  // Delete story
  const handleDeleteStory = async () => {
    if (!selectedStory) return;
    setIsSubmitting(true);
    try {
      await adminApiClient.deleteStory(selectedStory.id);
      setStories(prev => prev.filter(s => s.id !== selectedStory.id));
      setIsDeleteModalOpen(false);
      setSelectedStory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete story');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle visibility
  const handleToggleVisibility = async () => {
    if (!selectedStory) return;
    setIsSubmitting(true);
    try {
      const newVisibility = !selectedStory.isPublic;
      const response = await adminApiClient.updateStoryVisibility(selectedStory.id, newVisibility);
      setStories(prev => prev.map(s => s.id === selectedStory.id ? response.story : s));
      setIsVisibilityModalOpen(false);
      setSelectedStory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update story visibility');
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

  // Get thumbnail from first frame
  const getThumbnail = (story: AdminStory) => {
    if (story.frames && story.frames.length > 0 && story.frames[0]?.image_url) {
      return story.frames[0].image_url;
    }
    return null;
  };

  return (
    <>
      <SEO 
        title="Manage Stories | Admin Dashboard"
        description="Admin story management panel"
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-8">
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
                <BookOpen className="w-8 h-8" />
                <h1 className="text-2xl font-bold">Manage Stories</h1>
              </div>
              <button
                onClick={loadStories}
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
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search stories by title, author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={visibilityFilter}
                    onChange={(e) => setVisibilityFilter(e.target.value as 'all' | 'public' | 'private')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Stories</option>
                    <option value="public">Public Only</option>
                    <option value="private">Private Only</option>
                  </select>
                </div>
                <div className="text-sm text-gray-500">
                  Showing {filteredStories.length} of {pagination.total} stories
                </div>
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

          {/* Stories Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                  <div className="aspect-video bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-md">
              <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Stories Found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStories.map((story) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-100">
                    {getThumbnail(story) ? (
                      <img
                        src={getThumbnail(story)!}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}
                    {/* Visibility Badge */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                      story.isPublic 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {story.isPublic ? 'Public' : 'Private'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{story.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">by {story.userName}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                      <span>{story.totalFrames} frames</span>
                      <span>{story.likes} likes</span>
                      <span>{formatDate(story.createdAt)}</span>
                    </div>
                    {story.genre && (
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full mb-3">
                        {story.genre}
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <Link
                        to={`/stories/${story.id}`}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </Link>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedStory(story); setIsVisibilityModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title={story.isPublic ? 'Make Private' : 'Make Public'}
                        >
                          {story.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => { setSelectedStory(story); setIsDeleteModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Story"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredStories.length > 0 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.offset === 0}
                  className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasMore}
                  className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {isDeleteModalOpen && selectedStory && (
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
                  <h2 className="text-xl font-bold">Delete Story</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>"{selectedStory.title}"</strong> by {selectedStory.userName}? 
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteStory}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Deleting...' : 'Delete Story'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visibility Toggle Modal */}
        <AnimatePresence>
          {isVisibilityModalOpen && selectedStory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setIsVisibilityModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 text-purple-600 mb-4">
                  {selectedStory.isPublic ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  <h2 className="text-xl font-bold">
                    {selectedStory.isPublic ? 'Make Private' : 'Make Public'}
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">
                  {selectedStory.isPublic 
                    ? `Remove "${selectedStory.title}" from the public gallery? Users will no longer be able to see it.`
                    : `Add "${selectedStory.title}" to the public gallery? Anyone will be able to view it.`
                  }
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setIsVisibilityModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleToggleVisibility}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : (selectedStory.isPublic ? 'Make Private' : 'Make Public')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default AdminStories;
