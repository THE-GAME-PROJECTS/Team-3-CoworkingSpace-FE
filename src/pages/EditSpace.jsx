import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function EditSpace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, authFetch } = useAuth();

  const [space, setSpace] = useState({
    name: "",
    description: "",
    price_per_hour: "",
    address: "",
    google_maps_link: "",
    capacity: "",
    wifi_available: false,
    projector_available: false,
    status: "available",
    image_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Завантаження даних приміщення
  const fetchSpace = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await authFetch(`/spaces/${id}`);
      if (!response.ok) throw new Error("Не вдалося завантажити дані");

      const data = await response.json();
      setSpace({
        name: data.name || "",
        description: data.description || "",
        price_per_hour: data.price_per_hour ? String(data.price_per_hour) : "",
        address: data.address || "",
        google_maps_link: data.google_maps_link || "",
        capacity: data.capacity ? String(data.capacity) : "",
        wifi_available: Boolean(data.wifi_available),
        projector_available: Boolean(data.projector_available),
        status: data.status || "available",
        image_url: data.image_url || "",
      });
    } catch (error) {
      setError(error.message || "Не вдалося завантажити дані");
    } finally {
      setLoading(false);
    }
  }, [id, authFetch]);

  useEffect(() => {
    fetchSpace();
  }, [fetchSpace]);

  // Обробка змін у формі
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSpace((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Відправка форми
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Валідація
      if (!space.name.trim() || !space.address.trim()) {
        throw new Error("Назва та адреса є обов'язковими полями");
      }
      if (!space.image_url.trim()) {
        throw new Error("Будь ласка, додайте посилання на зображення");
      }
      const dataToSend = {
        name: space.name,
        description: space.description,
        price_per_hour: parseFloat(space.price_per_hour),
        address: space.address,
        google_maps_link: space.google_maps_link,
        capacity: parseInt(space.capacity),
        wifi_available: Boolean(space.wifi_available),
        projector_available: Boolean(space.projector_available),
        status: space.status,
        image_url: space.image_url,
      };
      const response = await authFetch(`/spaces/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.detail) {
          throw new Error(
            Array.isArray(errorData.detail)
              ? errorData.detail.map((err) => err.msg).join("\n")
              : errorData.detail,
          );
        }
        throw new Error(errorData.message || "Помилка валідації даних");
      }

      navigate("/spaces");
    } catch (error) {
      setError(
        error.message || "Не вдалося оновити дані. Перевірте введені значення.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="container mx-auto px-4 py-8 mt-8 max-w-[900px]">
        <p className="text-red-500 text-center py-8">
          Доступ заборонено. Необхідні права адміністратора.
        </p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="container mx-auto px-4 py-8 mt-8 max-w-[900px]">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 ml-4">
        Редагувати приміщення
      </h1>
      <div className="bg-white rounded-lg shadow-md p-6 mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Назва приміщення
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={space.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="Введіть назву"
            />
          </div>
          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Детальний опис
            </label>
            <textarea
              id="description"
              name="description"
              value={space.description}
              onChange={handleChange}
              rows={4}
              className="resize-none w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="Опишіть приміщення, його особливості та можливості"
            />
          </div>
          {/* Price */}
          <div>
            <label
              htmlFor="price_per_hour"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Ціна за годину (₴)
            </label>
            <input
              id="price_per_hour"
              name="price_per_hour"
              type="number"
              value={space.price_per_hour}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="Введіть ціну"
            />
          </div>
          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Повна адреса
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={space.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="Введіть назву вулиці та номер будинку"
            />
          </div>
          {/* Google Maps Link */}
          <div>
            <label
              htmlFor="google_maps_link"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Посилання на Google Maps
            </label>
            <input
              id="google_maps_link"
              name="google_maps_link"
              type="url"
              value={space.google_maps_link}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="https://goo.gl/maps/..."
            />
          </div>
          {/* Capacity */}
          <div>
            <label
              htmlFor="capacity"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Максимальна кількість людей
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              value={space.capacity}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="Введіть кількість"
            />
          </div>
          {/* WiFi */}
          <div className="flex items-center">
            <input
              id="wifi_available"
              name="wifi_available"
              type="checkbox"
              checked={space.wifi_available}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label
              htmlFor="wifi_available"
              className="ml-2 block text-sm text-gray-700"
            >
              Наявність Wi-Fi
            </label>
          </div>
          {/* Projector */}
          <div className="flex items-center">
            <input
              id="projector_available"
              name="projector_available"
              type="checkbox"
              checked={space.projector_available}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label
              htmlFor="projector_available"
              className="ml-2 block text-sm text-gray-700"
            >
              Наявність проєктора
            </label>
          </div>
          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Статус
            </label>
            <select
              id="status"
              name="status"
              value={space.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="available">Доступно</option>
              <option value="unavailable">Недоступно</option>
            </select>
          </div>
          {/* Image URL Field */}
          <div>
            <label
              htmlFor="image_url"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Посилання на зображення (URL)
            </label>
            <input
              id="image_url"
              name="image_url"
              type="url"
              value={space.image_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="https://example.com/image.jpg"
            />
            {space.image_url && (
              <div className="mt-2">
                <img
                  src={space.image_url}
                  alt="Прев'ю"
                  className="w-full h-64 object-cover rounded-md"
                />
              </div>
            )}
          </div>
          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Збереження..." : "Зберегти зміни"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
