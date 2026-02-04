import React from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';

export const PasswordResetPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    // Redirect to auth page with forgot mode if no token
    return <Navigate to="/auth?mode=forgot" replace />;
  }

  // Redirect to auth page with reset mode and token
  return <Navigate to={`/auth?mode=reset&token=${token}`} replace />;
};
