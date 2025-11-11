import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = () => {
  const location = useLocation();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="max-w-md text-center p-8 bg-gray-900 rounded-3xl shadow-2xl">
        {/* Custom image with fallback */}
        {!imgError ? (
          <img
            src="https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUyMHV2aTcwYWxzd2FuZGVmMWNtYTIxZzJhN3Nlajk1MmUzYmFvYjdqZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ROF8OQvDmxytW/giphy.gif" // Replace with your image path
            alt="Page Not Found"
            className="mx-auto mb-6 w-48 h-48 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="mx-auto mb-6 w-48 h-48 flex items-center justify-center text-6xl text-purple-500 font-bold">
            404
          </div>
        )}

        <h1 className="mb-4 text-4xl font-extrabold text-white tracking-tight">
          Page Not Found
        </h1>
        <p className="mb-8 text-lg text-gray-300">
          Oops! The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:scale-105 transform transition duration-300 rounded-lg font-semibold shadow-lg"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
