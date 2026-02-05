import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Mail, Calendar, Shield, Save, Trash2 } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import SEO from '../common/SEO';
import Button from '../ui/Button';
import { authApiClient } from '../../lib/authApi';

const ProfileSettings: React.FC = () => {
  const { user, refreshUserProfile } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await authApiClient.updateProfile({
        name: formData.name,
        email: formData.email,
      });
      
      // Refresh user profile in context
      await refreshUserProfile();
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (globalThis.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      console.log('Deleting account');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <SEO
        title="Profile Settings | Scripto"
        description="Manage your Scripto profile settings and preferences"
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
              <UserCircle className="w-16 h-16" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-center">
              Profile Settings
            </h1>
            <p className="text-lg text-blue-100 text-center max-w-2xl mx-auto">
              Manage your account information and preferences
            </p>
          </div>
        </motion.div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-800">Account Information</h2>
              <Button
                variant={isEditing ? 'secondary' : 'primary'}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>

            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4" />
                    Name
                  </div>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-stone-900 text-lg">{user?.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-stone-900 text-lg">{user?.email || 'Not provided'}</p>
                    {user?.isEmailVerified && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Account Created */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </div>
                </label>
                <p className="text-stone-900 text-lg">
                  {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                </p>
              </div>

              {/* Role */}
              {user?.role && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Role
                    </div>
                  </label>
                  <p className="text-stone-900 text-lg capitalize">{user.role}</p>
                </div>
              )}

              {/* Success/Error Messages */}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  {success}
                </div>
              )}
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  {error}
                </div>
              )}

              {isEditing && (
                <div className="pt-4">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    className="flex items-center gap-2"
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-red-200"
          >
            <h2 className="text-2xl font-bold text-red-600 mb-4">Danger Zone</h2>
            <p className="text-stone-600 mb-6">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ProfileSettings;
