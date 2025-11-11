import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4">
      <div className="max-w-md text-center p-8 bg-white rounded-3xl shadow-xl animate-fade-in">
        <div className="flex justify-center mb-6">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 animate-bounce" />
        </div>
        <h1 className="mb-4 text-6xl font-extrabold text-gray-800 tracking-tight">404</h1>
        <p className="mb-6 text-lg text-gray-600">
          Oops! The page you're looking for doesn’t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold shadow-md transition duration-300"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
