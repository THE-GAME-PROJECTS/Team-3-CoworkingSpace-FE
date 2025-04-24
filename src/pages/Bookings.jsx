import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { format, parseISO } from "date-fns";
import LoadingSpinner from "../components/LoadingSpinner";

// ----------------------------
// Helper Functions Block
// ----------------------------
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
  // ----------------------------
  // State Management Block
  // ----------------------------
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, authFetch } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  // ----------------------------
  // Data Fetching Block
  // ----------------------------
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await authFetch("/bookings/my-bookings");
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

  // ----------------------------
  // Booking Cancellation Block
  // ----------------------------
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

  // ----------------------------
  // Loading & Error States Block
  // ----------------------------
  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <p className="text-red-500">{error}</p>;

  const filteredBookings = bookings.filter((booking) => {
    const matchStatus =
      selectedStatus === "all" || booking.status === selectedStatus;

    const bookingDate = booking.start_date.split("T")[0];
    const matchDate = selectedDate === "" || bookingDate === selectedDate;

    const bookingStart = new Date(booking.start_time);
    const bookingTime = format(bookingStart, "HH:mm");

    const matchStartTime =
      selectedStartTime === "" || booking.start_time >= selectedStartTime;

    const matchEndTime =
      selectedEndTime === "" || booking.end_time <= selectedStartTime;

    const noFiltersSelected =
      selectedStatus === "all" &&
      selectedDate === "" &&
      selectedStartTime === "" &&
      selectedEndTime === "";
    return noFiltersSelected(
      matchStatus && matchDate && selectedStartTime && matchEndTime,
    );
  });

  // ----------------------------
  // Render Block
  // ----------------------------
  return (
    <div className="container mx-auto px-4 py-8 max-w-[1200px] mt-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Мої бронювання</h1>

      {/* Empty State Block */}
      {bookings.length === 0 ? (
        <p className="text-gray-500 text-center">
          У вас немає активних бронювань
        </p>
      ) : (
        <div className="space-y-4">
          {/* Bookings List Block */}
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
              {/* Filtering */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Фільтр за статусом */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Фільтр за статусом
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  >
                    <option value="all">Усі</option>
                    <option value="pending">Очікує</option>
                    <option value="approved">Підтверджено</option>
                    <option value="rejected">Відхилено</option>
                  </select>
                </div>

                {/* Фільтр за датою */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата
                  </label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                    }}
                  />
                </div>

                {/* Фільтр за часом */}
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Час від
                    </label>
                    <input
                      type="time"
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      value={selectedStartTime}
                      onChange={(e) => {
                        setSelectedStartTime(e.target.value);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      до
                    </label>
                    <input
                      type="time"
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      value={selectedEndTime}
                      onChange={(e) => {
                        setSelectedEndTime(e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-start">
                {/* Booking Info Block */}
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

                {/* Price & Actions Block */}
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
