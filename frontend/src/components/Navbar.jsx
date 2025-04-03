import { API_ROUTES } from '@/config/apiRoutes';
import { APP_ROUTES } from '@/config/appRoutes';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '@/context/AuthContext';

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(API_ROUTES.AUTH.LOGIN);
  };

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-bold">VulnScanner</div>
      <div className="space-x-4">
        {!isAuthenticated && (
          <>
            <Link to={APP_ROUTES.LOGIN} className="hover:underline">Login</Link>
            <Link to={APP_ROUTES.REGISTER} className="hover:underline">Register</Link>
          </>
        )}
        {isAuthenticated && (
          <>
            <Link to={APP_ROUTES.VULNERABILITY_LIST} className="hover:underline">Vulnerabilities</Link>
            <button onClick={handleLogout} className="hover:underline ml-4">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
