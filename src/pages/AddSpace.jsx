import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AddSpace() {
  // ==============================================
  // 1. STATE MANAGEMENT
  // ==============================================
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_per_hour: "",
    address: "",
    google_maps_link: "",
    capacity: "",
    wifi_available: false,
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { isAdmin, authFetch } = useAuth();

  // ==============================================
  // 2. FORM HANDLERS
  // ==============================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const imageUrls = images.length > 0 ? await uploadImages() : [];

      const response = await authFetch("/spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          image_urls: imageUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Не вдалося додати приміщення");
      }

      navigate("/spaces");
    } catch (error) {
      setError(error.message || "Помилка при додаванні простору");
      console.error("AddSpace error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==============================================
  // 3. IMAGE HANDLING
  // ==============================================
  const uploadImages = async () => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await authFetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Не вдалося завантажити зображення");
    }

    return await response.json();
  };

  const handleFiles = (files) => {
    const newImages = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (newImages.length !== files.length) {
      setError("Будь ласка, вибирайте тільки зображення (PNG, JPG, JPEG, GIF)");
    }

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }, []);

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ==============================================
  // 4. ADMIN CHECK
  // ==============================================
  if (!isAdmin()) {
    return (
      <div className="container mx-auto px-4 py-8 mt-8 max-w-[900px]">
        <p className="text-red-500 text-center py-8">
          Доступ заборонено. Необхідні права адміністратора.
        </p>
      </div>
    );
  }

  // ==============================================
  // 5. COMPONENT RENDERING
  // ==============================================
  return (
    <div className="container mx-auto px-4 py-8 mt-8 max-w-[900px]">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 ml-4">
        Додати нове приміщення
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
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
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="Введіть назву"
            />
          </div>

          {/* Description Field */}
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
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="resize-none w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="Опишіть приміщення, його особливості та можливості"
            />
          </div>

          {/* Price Field */}
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
              value={formData.price_per_hour}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="Введіть ціну"
            />
          </div>

          {/* Address Field */}
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
              value={formData.address}
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
              value={formData.google_maps_link}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="https://goo.gl/maps/..."
              pattern="https?://(www\.)?google\.[a-z]+/maps/.*"
            />
          </div>

          {/* Capacity Field */}
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
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="Введіть кількість"
            />
          </div>

          {/* WiFi Checkbox */}
          <div className="flex items-center">
            <input
              id="wifi_available"
              name="wifi_available"
              type="checkbox"
              checked={formData.wifi_available}
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

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фото приміщення
            </label>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>

                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none"
                  >
                    <span>Завантажте фото</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFiles(e.target.files)}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">або перетягніть сюди</p>
                </div>

                <p className="text-xs text-gray-500">
                  Підтримуються: PNG, JPG, JPEG, GIF (макс. 10MB на зображення)
                </p>
              </div>
            </div>
          </div>

          {/* Image Preview Section */}
          {images.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Завантажені фото ({images.length})
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Прев'ю ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Видалити фото"
                    >
                      &times;
                    </button>

                    <div className="text-xs text-gray-500 truncate mt-1">
                      {image.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full flex justify-center items-center py-3 px-4 border border-transparent 
                rounded-md shadow-sm text-sm font-medium text-white 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                transition-transform duration-100 ease-in-out
                ${loading ? "bg-green-400" : "bg-green-600 hover:bg-green-700"}
                active:scale-95
              `}
            >
              {loading ? (
                <>
                  <LoadingSpinner small className="mr-2" />
                  Збереження...
                </>
              ) : (
                "Зберегти зміни"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
