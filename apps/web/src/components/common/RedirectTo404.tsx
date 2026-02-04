import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component that redirects to the standalone 404 page
 */
const RedirectTo404: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/404', { replace: true });
  }, [navigate]);

  return null; // This component doesn't render anything
};

export default RedirectTo404;
