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
    projector_available: false,
    status: "available",
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [base64Images, setBase64Images] = useState([]);
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

  // ==============================================
  // 3. IMAGE HANDLING (OPTIMIZED)
  // ==============================================
  const processImages = async (files) => {
    const validImages = Array.from(files).filter((file) =>
      file.type.match(/image\/(jpeg|png|gif|jpg)/i),
    );

    if (validImages.length !== files.length) {
      setError("Дозволені тільки зображення (JPEG, PNG, GIF)");
      return;
    }

    // Перевірка розміру файлів (макс. 5MB)
    const oversized = validImages.some((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      setError("Максимальний розмір зображення - 5MB");
      return;
    }

    try {
      // Генерація прев'ю
      const previews = validImages.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);

      // Конвертація в base64 (без префікса data:image/)
      const base64Results = await Promise.all(
        validImages.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const base64 = reader.result.split(",")[1];
              resolve({
                base64,
                name: file.name,
                type: file.type,
              });
            };
          });
        }),
      );

      setBase64Images((prev) => [...prev, ...base64Results]);
    } catch (error) {
      console.error("Image processing failed:", error);
      setError("Помилка при обробці зображень");
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processImages(e.target.files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Перевіряємо і додаємо прев'ю
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);

    // Конвертуємо в base64 об'єкти
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(",")[1];
        setBase64Images((prevBase64s) => [
          ...prevBase64s,
          {
            base64,
            name: file.name,
            type: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    // Очистка пам'яті для прев'ю
    URL.revokeObjectURL(imagePreviews[index]);

    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setBase64Images((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Валідація обов'язкових полів
      if (!formData.name.trim() || !formData.address.trim()) {
        throw new Error("Назва та адреса є обов'язковими полями");
      }

      if (base64Images.length === 0) {
        throw new Error("Будь ласка, додайте хоча б одне зображення");
      }

      const response = await authFetch("/spaces/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          image_url: base64Images.map((img) => img.base64),
          // Приведення до типів API
          projector_available: Boolean(formData.projector_available),
          wifi_available: Boolean(formData.wifi_available),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || errorData.message || "Помилка сервера",
        );
      }

      navigate("/spaces");
    } catch (error) {
      setError(error.message);
      console.error("Submission error:", error);
    } finally {
      setLoading(false);
    }
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
              pattern="^(https?:\/\/)?(www\.)?(google|goo)\.(com|com\.ua|gl)\/maps(\/|\/place\/|\/dir\/|\/search\/).+"
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
                      onChange={handleFileInput}
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
          {imagePreviews.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Завантажені фото ({imagePreviews.length})
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
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
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner small className="mr-2" />
              ) : (
                "Додати приміщення"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
