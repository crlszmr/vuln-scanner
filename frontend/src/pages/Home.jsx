import { APP_ROUTES } from '@/config/appRoutes';
import { Link } from "react-router-dom";
import { useAuth } from '@/context/AuthContext';

function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6 text-center">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">Welcome to VulnScanner</h1>
      <p className="text-lg text-gray-700 mb-6">
        This is a simple web application that helps you detect and analyze system vulnerabilities.
      </p>

      {!isAuthenticated ? (
        <div className="space-x-4">
          <Link to={APP_ROUTES.LOGIN} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Login</Link>
          <Link to={APP_ROUTES.REGISTER} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Register</Link>
        </div>
      ) : (
        <Link to={APP_ROUTES.VULNERABILITY_LIST} className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Go to Dashboard</Link>
      )}
    </div>
  );
}

export default Home;
