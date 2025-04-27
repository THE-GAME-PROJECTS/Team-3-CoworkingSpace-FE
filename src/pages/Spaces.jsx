import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Spaces() {
  // ==============================================
  // 1. STATE AND HOOKS INITIALIZATION
  // ==============================================
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterMinCapacity, setFilterMinCapacity] = useState("");
  const [filterMaxCapacity, setFilterMaxCapacity] = useState("");

  const { user, isAdmin, authFetch } = useAuth();
  const navigate = useNavigate();

  // ==============================================
  // 2. DATA FETCHING LOGIC
  // ==============================================
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const response = await authFetch("/spaces/");

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          const text = await response.text();
          throw new Error(
            `Очікувався JSON, але отримано HTML: ${text.slice(0, 100)}...`,
          );
        }

        if (!response.ok) throw new Error("Не вдалося завантажити приміщення");

        const data = await response.json();
        setSpaces(Array.isArray(data) ? data : [data]);
      } catch (error) {
        console.error("Error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, [authFetch]);

  // ==============================================
  // 3. SPACE MANAGEMENT FUNCTIONS
  // ==============================================
  const handleDeleteSpace = async (id) => {
    try {
      setLoading(true);
      const response = await authFetch(`/spaces/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Не вдалося видалити приміщення");

      setSpaces(spaces.filter((space) => space.id !== id));
    } catch (error) {
      console.error("Error deleting space:", error);
      setError("Не вдалося видалити приміщення");
    } finally {
      setLoading(false);
    }
  };

  // ==============================================
  // 4. FILTERING LOGIC
  // ==============================================
  const filteredSpaces = spaces.filter((space) => {
    const price = parseFloat(space.price_per_hour);
    const capacity = parseInt(space.capacity);

    const isPriceValid =
      (minPrice === "" || price >= parseFloat(minPrice)) &&
      (maxPrice === "" || price <= parseFloat(maxPrice));

    const isCapacityValid =
      (minCapacity === "" || capacity >= parseInt(minCapacity)) &&
      (maxCapacity === "" || capacity <= parseInt(maxCapacity));

    return isPriceValid && isCapacityValid;
  });

  // ==============================================
  // 5. LOADING AND ERROR STATES
  // ==============================================
  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <p className="text-red-500 text-center mb-4">{error}</p>;

  const handleApplyFilters = () => {
    setMinPrice(filterMinPrice);
    setMaxPrice(filterMaxPrice);
    setMinCapacity(filterMinCapacity);
    setMaxCapacity(filterMaxCapacity);
  };

  // ==============================================
  // 6. RENDER COMPONENT
  // ==============================================
  return (
    <div className="container mx-auto px-4 py-8 max-w-[1200px]">
      <h1 className="text-3xl font-bold mt-8 mb-10 ml-4">Приміщення</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 items-end">
        <input
          type="number"
          placeholder="Мін. ціна"
          value={filterMinPrice}
          onChange={(e) => setFilterMinPrice(e.target.value)}
          className="border rounded-md px-3 py-2"
        />
        <input
          type="number"
          placeholder="Макс. ціна"
          value={filterMaxPrice}
          onChange={(e) => setFilterMaxPrice(e.target.value)}
          className="border rounded-md px-3 py-2"
        />
        <input
          type="number"
          placeholder="Мін. кількість місць"
          value={filterMinCapacity}
          onChange={(e) => setFilterMinCapacity(e.target.value)}
          className="border rounded-md px-3 py-2"
        />
        <input
          type="number"
          placeholder="Макс. кількість місць"
          value={filterMaxCapacity}
          onChange={(e) => setFilterMaxCapacity(e.target.value)}
          className="border rounded-md px-3 py-2"
        />
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Застосувати
        </button>
      </div>

      {filteredSpaces.length === 0 ? (
        <p className="text-gray-500">Приміщень не знайдено.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <div
              key={space.id}
              className="bg-white rounded-md shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link to={`/spaces/${space.id}`}>
                <img
                  src={
                    space.image_url && space.image_url.length > 0
                      ? space.image_url[0]
                      : "/default-space.jpg"
                  }
                  alt={space.name || "Приміщення"}
                  className="w-full h-[270px] object-cover bg-gray-200"
                />
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{space.name}</h2>
                  <p className="text-green-600 font-bold">
                    {Math.floor(space.price_per_hour)} грн/год
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Адреса:</span> {space.address}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Кількість місць:</span>{" "}
                    {space.capacity}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Wi-Fi:</span>{" "}
                    {space.hasWiFi ? (
                      <span className="text-green-600">Так</span>
                    ) : (
                      <span className="text-red-600">Ні</span>
                    )}
                  </p>
                </div>
              </Link>

              {/* ================================== */}
              {/* 6.2.2. ADMIN ACTIONS */}
              {/* ================================== */}
              {isAdmin() && (
                <div className="flex space-x-2 p-4 pt-0">
                  <Link
                    to={`/admin/edit-space/${space.id}`}
                    className="px-4 py-2 bg-transparent border-[2.5px] border-green-600 text-green-600 rounded-md hover:bg-green-600 hover:text-white transition-colors duration-150"
                  >
                    Редагувати
                  </Link>
                  <button
                    onClick={() => handleDeleteSpace(space.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Видалити
                  </button>
                </div>
              )}

              {/* ================================== */}
              {/* 6.2.3. USER ACTIONS */}
              {/* ================================== */}
              {user && !isAdmin() && (
                <div className="p-4">
                  <button
                    onClick={() => navigate(`/spaces/${space.id}`)}
                    className="w-full block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-center"
                  >
                    Забронювати
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
