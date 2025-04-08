import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { format, parseISO } from "date-fns";
import LoadingSpinner from "../components/LoadingSpinner";

function getStatusText(status) {
  switch (status) {
    case "approved":
      return "Підтверджено";
    case "rejected":
      return "Відхилено";
    default:
      return "Очікує підтвердження";
  }
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, authFetch } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await authFetch("/bookings/user");
        if (!response.ok) throw new Error("Невдалося завантажити бронювання");
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error("Error loading bookings:", error);
        setError("Не вдалося завантажити бронювання");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [authFetch, user]);

  const cancelBooking = async (id) => {
    try {
      const response = await authFetch(`/bookings/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Не вдалося скасувати бронювання");

      setBookings(bookings.filter((booking) => booking.id !== id));
    } catch (error) {
      console.error("Error canceling booking:", error);
      setError("Не вдалося скасувати бронювання");
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1200px] mt-8">
      <h1 className="text-3xl font-bold mb-6">Мої бронювання</h1>

      {bookings.length === 0 ? (
        <p className="text-gray-500">У вас немає активних бронювань</p>
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
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{booking.spaceName}</h2>
                  <p className="text-gray-600">
                    {format(parseISO(booking.startDate), "PPpp")} -{" "}
                    {format(parseISO(booking.endDate), "PPpp")}
                  </p>
                  <p className="text-gray-600 font-medium">
                    Статус: {getStatusText(booking.status)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {booking.totalPrice} грн
                  </p>
                  {booking.status === "pending" && (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
                    >
                      Скасувати
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
