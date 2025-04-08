import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/space-coworking-favicon.ico";

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth();

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
      <div className="container mx-auto px-4 ">
        <div className="flex items-center justify-between h-16 max-w-[1080px] mx-auto">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="Space Coworking Logo" className="h-8 w-8" />
            <span className="font-semibold text-xl">Space Coworking</span>
          </Link>

          <div className="flex items-center space-x-8">
            {user ? (
              <>
                <Link
                  to="/spaces"
                  className="text-gray-600 hover:text-green-600"
                >
                  Приміщення
                </Link>
                {isAdmin() ? (
                  <>
                    <Link
                      to="/admin/add-space"
                      className="text-gray-600 hover:text-green-600"
                    >
                      Додати приміщення
                    </Link>
                    <Link
                      to="/admin/bookings"
                      className="text-gray-600 hover:text-green-600"
                    >
                      Бронювання
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/user/bookings"
                    className="text-gray-600 hover:text-green-600"
                  >
                    Мої бронювання
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="text-gray-600 hover:text-red-600"
                >
                  Вийти
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-green-600"
                >
                  Увійти
                </Link>
                <Link
                  to="/register"
                  className="text-gray-600 hover:text-green-600"
                >
                  Зареєструватися
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
