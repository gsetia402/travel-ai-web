import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';

export default function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}
