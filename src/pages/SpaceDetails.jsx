import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function SpaceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, authFetch } = useAuth();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const response = await authFetch(`/spaces/${id}`);
        if (!response.ok) throw new Error("Не вдалося завантажити приміщення");
        const data = await response.json();
        setSpace(data);
      } catch (error) {
        console.error("Error fetching space:", error);
        setError("Не вдалося завантажити приміщення");
      } finally {
        setLoading(false);
      }
    };

    fetchSpace();
  }, [id, authFetch]);

  const handleDeleteSpace = async () => {
    try {
      const response = await authFetch(`/spaces/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Не вдалося видалити приміщення");

      navigate("/spaces");
    } catch (error) {
      console.error("Error deleting space:", error);
      setError("Не вдалося видалити приміщення");
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!space) return <p className="text-gray-500">Приміщення не знайдено.</p>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1000px]">
      <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
        {/* Назва приміщення */}
        <h1 className="text-3xl font-bold mb-6">{space.name}</h1>

        {/* Опис */}
        <p className="text-gray-600 mb-4">{space.description}</p>

        {/* Ціна */}
        <p className="text-lg text-green-600 font-bold mb-4">
          {space.price_per_hour} грн/год
        </p>

        {/* Адреса з лінком */}
        <p className="text-gray-700 mb-2">
          <span className="font-semibold">Адреса:</span>{" "}
          <a
            className="text-green-500 hover:underline"
            href={space.google_maps_link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {space.address}
          </a>
        </p>

        {/* Кількість місць */}
        <p className="text-gray-700 mb-2">
          <span className="font-semibold">Кількість місць:</span>{" "}
          {space.capacity}
        </p>

        {/* Наявність Wi-Fi */}
        <p className="text-gray-700 mb-4">
          <span className="font-semibold">Наявність Wi-Fi:</span>{" "}
          {space.wifi_available ? "Так" : "Ні"}
        </p>

        {/* Прев’ю зображення */}
        {space.image_url && (
          <div className="mb-6">
            <img
              src={space.image_url}
              alt="Фото приміщення"
              className="w-full max-w-l h-64 object-cover rounded-md mx-auto"
            />
          </div>
        )}

        {/* Галерея зображень (якщо у вас масив images) */}
        {/* 
        {Array.isArray(space.images) && space.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {space.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Space ${space.id} Image ${index}`}
                className="w-full h-36 object-cover rounded-sm"
              />
            ))}
          </div>
        )}
        */}

        {/* Кнопки дій */}
        <div className="flex space-x-4">
          {user && !isAdmin() && (
            <Link
              to={`/book-space/${space.id}`}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Забронювати
            </Link>
          )}

          {isAdmin() && (
            <>
              <Link
                to={`/admin/edit-space/${space.id}`}
                className="px-4 py-2 bg-transparent border-[2.5px] border-green-600 text-green-600 rounded-md hover:bg-green-600 hover:text-white transition-colors duration-150"
              >
                Редагувати
              </Link>
              <button
                onClick={handleDeleteSpace}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Видалити
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
