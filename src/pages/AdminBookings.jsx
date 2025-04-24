import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { format, parseISO } from "date-fns";
import LoadingSpinner from "../components/LoadingSpinner";

// ----------------------------
// Helper Functions Block
// ----------------------------
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
  // ----------------------------
  // State Management Block
  // ----------------------------
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState(null);
  const { isAdmin, authFetch } = useAuth();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");

  // ----------------------------
  // Data Fetching Block
  // ----------------------------
  useEffect(() => {
    const loadBookings = async () => {
      try {
        const response = await authFetch("/bookings/all");
        if (!response.ok) throw new Error("Не вдалося завантажити бронювання");
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error("Помилка завантаження бронювань:", error);
        setError(error.message || "Не вдалося завантажити бронювання");
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [authFetch]);

  // ----------------------------
  // Booking Status Update Block
  // ----------------------------
  const updateBookingStatus = async (id, status) => {
    try {
      setLoading(true);
      setError("");
      setSyncStatus(null);

      const response = await authFetch(`/bookings/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Не вдалося оновити статус");
      }

      setBookings(
        bookings.map((booking) =>
          booking.id === id ? { ...booking, status } : booking,
        ),
      );
      setSyncStatus("Статус успішно оновлено");
    } catch (error) {
      console.error("Помилка оновлення статусу:", error);
      setError(error.message || "Не вдалося оновити статус");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Access Control & Loading States Block
  // ----------------------------
  if (!isAdmin()) return <p className="text-red-500">Доступ заборонено</p>;
  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <p className="text-red-500">{error}</p>;

  // ----------------------------
  // Filtering Booking by Date & Time
  // ----------------------------
  const filteredBookings = bookings.filter((booking) => {
    const matchStatus =
      filterStatus === "all" || booking.status === filterStatus;

    const bookingDate = booking.start_time.split("T")[0];
    const matchDate = selectedDate === "all" || bookingDate === selectedDate;

    const bookingStart = new Date(booking.start_time);
    const bookingTime = format(bookingStart, "HH:mm");

    const matchStartTime =
      selectedStartTime === "" || bookingTime >= selectedStartTime;

    const matchEndTime =
      selectedEndTime === "" || bookingTime <= selectedEndTime;

    const noFiltersSelected =
      filterStatus === "all" &&
      selectedDate === "" &&
      selectedStartTime === "" &&
      selectedEndTime === "";

    return (
      noFiltersSelected ||
      (matchStatus && matchDate && matchStartTime && matchEndTime)
    );
  });

  // ----------------------------
  // Render Block
  // ----------------------------
  return (
    <div className="container mx-auto px-4 py-8 max-w-[900px] mt-8">
      <h1 className="text-3xl font-bold mb-8 ml-2">Керування бронюваннями</h1>
      {/* Filtering */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Фільтр за статусом */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Фільтр за статусом
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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
      {/* Status Notification Block */}
      {syncStatus && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          {syncStatus}
        </div>
      )}
      {/* Bookings List Block */}
      {filteredBookings.length === 0 ? (
        <p className="text-gray-500">Немає бронювань</p>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingItem
              key={booking.id}
              booking={booking}
              updateBookingStatus={updateBookingStatus}
              loading={loading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------
// Booking Item Subcomponent (extracted for clarity)
// ----------------------------
const BookingItem = ({ booking, updateBookingStatus, loading }) => (
  <div
    className={`border rounded-md p-4 ${
      booking.status === "approved"
        ? "bg-green-50 border-green-200"
        : booking.status === "rejected"
        ? "bg-red-50 border-red-200"
        : "bg-yellow-50 border-yellow-200"
    }`}
  >
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-xl font-semibold mb-2">{booking.space.name}</h2>
        <p className="text-gray-600">
          {format(parseISO(booking.start_time), "dd.MM.yyyy")}
          {" | "}
          {format(parseISO(booking.start_time), "HH:mm")} -{""}
          {format(parseISO(booking.end_time), "HH:mm")}
        </p>

        <p className="text-gray-600">
          <span className="font-medium">Користувач:</span>{" "}
          {booking.user.username} ({booking.user.email})
        </p>
        <p className="text-gray-600 font-medium">
          Статус: {getStatusText(booking.status)}
        </p>
        {booking.comment && (
          <p className="mt-2">
            <span className="font-medium">Коментар:</span> {booking.comment}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-green-600">
          {booking.total_price} грн
        </p>
        <div className="mt-2 space-x-2">
          <button
            onClick={() => updateBookingStatus(booking.id, "approved")}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm"
            disabled={loading}
          >
            Підтвердити
          </button>
          <button
            onClick={() => updateBookingStatus(booking.id, "rejected")}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm"
            disabled={loading}
          >
            Відхилити
          </button>
        </div>
      </div>
    </div>
  </div>
);
