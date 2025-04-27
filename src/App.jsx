import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import GuestRoute from "./components/GuestRoute.jsx";
import LoadingSpinner from "./components/LoadingSpinner";
import VerifyEmail from "./components/VerifyEmail";

const Spaces = lazy(() => import("./pages/Spaces"));
const SpaceDetails = lazy(() => import("./pages/SpaceDetails"));
const AdminBookings = lazy(() => import("./pages/AdminBookings"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AddSpace = lazy(() => import("./pages/AddSpace"));
const EditSpace = lazy(() => import("./pages/EditSpace"));
const BookSpace = lazy(() => import("./pages/BookSpace"));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Suspense fallback={<LoadingSpinner fullPage />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Spaces />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/spaces"
                  element={
                    <ProtectedRoute>
                      <Spaces />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/spaces/:id"
                  element={
                    <ProtectedRoute>
                      <SpaceDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/bookings"
                  element={
                    <ProtectedRoute>
                      <AdminBookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user/bookings"
                  element={
                    <ProtectedRoute>
                      <Bookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/add-space"
                  element={
                    <ProtectedRoute>
                      <AddSpace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/edit-space/:id"
                  element={
                    <ProtectedRoute>
                      <EditSpace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/book-space/:id"
                  element={
                    <ProtectedRoute>
                      <BookSpace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <GuestRoute>
                      <Login />
                    </GuestRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <GuestRoute>
                      <Register />
                    </GuestRoute>
                  }
                />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />
              </Routes>
            </Suspense>
          </main>
          <Toaster position="top-right" richColors />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
document.body.classList.add("scrollbar-overlay");
export default App;
