import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 px-4 overflow-hidden relative">
      {/* Soft colorful glow blobs */}
      <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
      <div className="absolute bottom-[-80px] right-[-60px] w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-pulse-slow"></div>
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse-slow"></div>

      <div className="relative max-w-md text-center p-12 bg-purple-950 bg-opacity-70 rounded-3xl shadow-2xl backdrop-blur-md animate-fade-in">
        <div className="text-8xl mb-6 text-purple-300 font-extrabold">💜</div>
        <h1 className="mb-4 text-4xl font-bold text-purple-100 tracking-tight">
          404
        </h1>
        <p className="mb-8 text-lg text-purple-200">
          Oops! The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 text-purple-900 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 hover:scale-105 transform transition duration-300 rounded-lg font-semibold shadow-lg"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
