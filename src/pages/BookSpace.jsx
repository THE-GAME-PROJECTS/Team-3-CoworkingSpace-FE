import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addHours, format, parseISO, isAfter, isBefore } from "date-fns";
import LoadingSpinner from "../components/LoadingSpinner";

export default function BookSpace() {
  // ----------------------------
  // Initialization Block
  // ----------------------------
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();

  // ----------------------------
  // State Management Block
  // ----------------------------
  const [space, setSpace] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addHours(new Date(), 1));
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);

  // ----------------------------
  // Data Fetching Block
  // ----------------------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const spaceResponse = await authFetch(`/spaces/${id}`);
        if (!spaceResponse.ok) {
          throw new Error("Не вдалося завантажити приміщення");
        }
        const spaceData = await spaceResponse.json();
        setSpace(spaceData);

        try {
          const bookingsResponse = await authFetch(`/bookings?space_id=${id}`);
          if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json();
            setBookedSlots(bookingsData);
          }
        } catch (bookingsError) {
          console.warn("Could not load bookings:", bookingsError);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message || "Не вдалося завантажити дані");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, authFetch]);

  // ----------------------------
  // Price Calculation Block
  // ----------------------------
  useEffect(() => {
    if (space && startDate && endDate) {
      const hours = Math.max(1, (endDate - startDate) / (1000 * 60 * 60));
      setTotalPrice(hours * space.price_per_hour);
    }
  }, [startDate, endDate, space]);

  // ----------------------------
  // Booking Submission Block
  // ----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!space) throw new Error("Приміщення не знайдено");
      if (!user) throw new Error("Користувач не авторизований");
      if (isAfter(startDate, endDate)) {
        throw new Error("Час закінчення повинен бути після часу початку");
      }

      const hasConflict = bookedSlots.some((booking) => {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        return (
          (isAfter(startDate, bookingStart) &&
            isBefore(startDate, bookingEnd)) ||
          (isAfter(endDate, bookingStart) && isBefore(endDate, bookingEnd)) ||
          (isBefore(startDate, bookingStart) && isAfter(endDate, bookingEnd))
        );
      });

      if (hasConflict) {
        throw new Error("Обраний час вже зайнятий");
      }

      const response = await authFetch("/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          space_id: space.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          comment,
          total_price: totalPrice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Не вдалося забронювати");
      }

      navigate("/user/bookings");
    } catch (error) {
      console.error("Booking error:", error);
      setError(error.message || "Не вдалося забронювати");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Conditional Rendering Block
  // ----------------------------
  if (!space && loading) return <LoadingSpinner fullPage />;
  if (error)
    return (
      <div className="container mx-auto p-4 text-red-500 mt-[50px] text-center">
        {error}
      </div>
    );

  // ----------------------------
  // Main Render Block
  // ----------------------------
  return (
    <div className="container mx-auto px-4 py-8 max-w-[900px]">
      <h1 className="text-3xl font-bold mb-[40px] mt-8">
        Забронювати: {space?.name}
      </h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Booking Form Block */}
        <div>
          <h2 className="text-xl font-semibold mb-4 ml-2">Деталі бронювання</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                  Початок
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={30}
                  dateFormat="MMMM d, yyyy HH:mm"
                  minDate={new Date()}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                  Кінець
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={30}
                  dateFormat="MMMM d, yyyy HH:mm"
                  minDate={startDate}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                Коментар (необов'язково)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2 border rounded resize-none"
                rows="5"
                maxLength="500"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium">До сплати:</h3>
              <p className="text-2xl font-bold text-green-600">
                {totalPrice.toFixed(2)} грн
              </p>
              <p className="text-sm text-gray-500">
                {space?.price_per_hour} грн/год ×{" "}
                {((endDate - startDate) / (1000 * 60 * 60)).toFixed(1)} год
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? <LoadingSpinner small /> : "Підтвердити бронювання"}
            </button>
          </form>
        </div>

        {/* Availability Calendar Block */}
        <div>
          <h2 className="text-xl font-semibold mb-6 ml-2">
            Календар доступності
          </h2>
          <div className="border rounded p-4">
            {bookedSlots.length > 0 ? (
              bookedSlots.map((booking) => (
                <div key={booking.id} className="mb-2 p-2 bg-gray-100 rounded">
                  <p>
                    <span className="font-medium">Зайнято:</span>{" "}
                    {format(parseISO(booking.start_date), "PPpp")} -{" "}
                    {format(parseISO(booking.end_date), "PPpp")}
                  </p>
                  {booking.comment && (
                    <p className="text-sm text-gray-600 mt-1">
                      {booking.comment}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">
                Немає інформації про заброньовані слоти
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
