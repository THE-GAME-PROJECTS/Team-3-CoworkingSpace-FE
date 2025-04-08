import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { format, parseISO } from "date-fns";
import LoadingSpinner from "../components/LoadingSpinner";

const getStatusText = (status) => {
  switch (status) {
    case "approved":
      return "Підтверджено";
    case "rejected":
      return "Відхилено";
    default:
      return "Очікує підтвердження";
  }
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState(null);
  const { isAdmin, authFetch } = useAuth();

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const response = await authFetch("/bookings/admin");
        if (!response.ok) throw new Error("Failed to load bookings");
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error("Error loading bookings:", error);
        setError("Не вдалося завантажити бронювання");
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [authFetch]);

  const updateBookingStatus = async (id, status) => {
    try {
      setLoading(true);
      setError("");
      setSyncStatus(null);

      const response = await authFetch(`/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Не вдалося оновити приміщення");
      }

      setBookings(
        bookings.map((booking) =>
          booking.id === id ? { ...booking, status } : booking,
        ),
      );
    } catch (error) {
      console.error("Error updating booking:", error);
      setError(error.message || "Не вдалося оновити статус");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin()) return <p className="text-red-500">Доступ заборонено</p>;
  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1200px] mt-8">
      <h1 className="text-3xl font-bold mb-6">Керування бронюваннями</h1>

      {syncStatus && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          {syncStatus}
        </div>
      )}

      {bookings.length === 0 ? (
        <p className="text-gray-500">Немає бронювань</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className={`border rounded-lg p-4 ${
                booking.status === "approved"
                  ? "bg-green-50 border-green-200"
                  : booking.status === "rejected"
                  ? "bg-red-50 border-red-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{booking.spaceName}</h2>
                  <p className="text-gray-600">
                    {format(parseISO(booking.startDate), "PPpp")} -{" "}
                    {format(parseISO(booking.endDate), "PPpp")}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Користувач:</span>{" "}
                    {booking.userName} ({booking.userEmail})
                  </p>
                  <p className="text-gray-600 font-medium">
                    Статус: {getStatusText(booking.status)}
                  </p>
                  {booking.comment && (
                    <p className="mt-2">
                      <span className="font-medium">Коментар:</span>{" "}
                      {booking.comment}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {booking.totalPrice} грн
                  </p>
                  <div className="mt-2 space-x-2">
                    <button
                      onClick={() =>
                        updateBookingStatus(booking.id, "approved")
                      }
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                      disabled={loading}
                    >
                      Підтвердити
                    </button>
                    <button
                      onClick={() =>
                        updateBookingStatus(booking.id, "rejected")
                      }
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                      disabled={loading}
                    >
                      Відхилити
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
