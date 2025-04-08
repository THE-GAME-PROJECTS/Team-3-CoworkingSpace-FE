import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function EditSpace() {
  // ==============================================
  // 1. STATE AND HOOKS INITIALIZATION
  // ==============================================
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, authFetch } = useAuth();

  const [space, setSpace] = useState({
    name: "",
    description: "",
    price_per_hour: "0",
    address: "",
    google_maps_link: "",
    capacity: "1",
    wifi_available: false,
    image_urls: [],
  });

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [newImages, setNewImages] = useState([]);

  // ==============================================
  // 2. DATA FETCHING LOGIC
  // ==============================================
  const fetchSpace = useCallback(async () => {
    if (!id) return;
    try {
      const response = await authFetch(`/spaces/${id}`);
      if (!response.ok) throw new Error("Не вдалося завантажити дані");

      const data = await response.json();
      setSpace({
        name: data.name || "",
        description: data.description || "",
        price_per_hour: data.price_per_hour ? String(data.price_per_hour) : "0",
        address: data.address || "",
        google_maps_link: data.google_maps_link || "",
        capacity: data.capacity ? String(data.capacity) : "1",
        wifi_available: Boolean(data.wifi_available),
        image_urls: data.image_urls || [],
      });
    } catch (error) {
      console.error("Помилка при завантаженні:", error);
      setError(error.message || "Не вдалося завантажити дані");
    }
  }, [id, authFetch]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSpace();
      setLoading(false);
    };

    loadData();
  }, [fetchSpace]);

  // ==============================================
  // 3. FORM HANDLERS
  // ==============================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSpace((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUploadError("");
    setUploadProgress(0);

    try {
      // Validate required fields
      const requiredFields = {
        name: space.name,
        description: space.description,
        price_per_hour: space.price_per_hour,
        capacity: space.capacity,
      };

      for (const [field, value] of Object.entries(requiredFields)) {
        if (!value || !value.toString().trim()) {
          throw new Error(`Поле ${field} є обов'язковим`);
        }
      }

      // Upload new images if any
      let uploadedImageUrls = [];
      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach((image) => {
          formData.append("images", image);
        });

        const uploadResponse = await authFetch("/upload", {
          method: "POST",
          body: formData,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percentCompleted);
          },
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          setUploadError(
            errorData.message || "Не вдалося завантажити зображення",
          );
          throw new Error("Не вдалося завантажити зображення");
        }
        uploadedImageUrls = await uploadResponse.json();
      }

      // Prepare data for submission
      const dataToSend = {
        name: space.name,
        description: space.description,
        price_per_hour: parseFloat(space.price_per_hour),
        address: space.address,
        google_maps_link: space.google_maps_link,
        capacity: parseInt(space.capacity),
        wifi_available: Boolean(space.wifi_available),
        image_urls: [...space.image_urls, ...uploadedImageUrls],
      };

      // Submit the form
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
          throw new Error(errorData.detail.map((err) => err.msg).join("\n"));
        }
        throw new Error(errorData.message || "Помилка валідації даних");
      }

      navigate("/spaces");
    } catch (error) {
      console.error("Помилка при оновленні:", error);
      setError(
        error.message || "Не вдалося оновити дані. Перевірте введені значення.",
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // ==============================================
  // 4. IMAGE HANDLING
  // ==============================================
  const handleFiles = useCallback((files) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ACCEPTED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    const validFiles = Array.from(files).filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        setError(`Файл ${file.name} занадто великий (макс. 10MB)`);
        return false;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`Файл ${file.name} має непідтримуваний формат`);
        return false;
      }
      return true;
    });

    setNewImages((prev) => [...prev, ...validFiles]);
    setError("");
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleFileInput = useCallback(
    (e) => {
      handleFiles(e.target.files);
      e.target.value = "";
    },
    [handleFiles],
  );

  const removeImage = useCallback((index) => {
    setSpace((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }));
  }, []);

  const removeNewImage = useCallback((index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ==============================================
  // 5. ADMIN PERMISSION CHECK
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
  // 6. COMPONENT RENDERING
  // ==============================================
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
              value={space.name}
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
              value={space.description}
              onChange={handleChange}
              rows={4}
              className="resize-none w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="Опишіть приміщення"
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
              value={space.price_per_hour}
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
              Адреса
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={space.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="Введіть адресу"
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

          {/* Capacity Field */}
          <div>
            <label
              htmlFor="capacity"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Кількість місць
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

          {/* WiFi Checkbox */}
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
                  Підтримуються: PNG, JPG, JPEG, GIF, WEBP (макс. 10MB)
                </p>
              </div>
            </div>
          </div>

          {/* Image Preview Section */}
          {(space.image_urls.length > 0 || newImages.length > 0) && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {space.image_urls.length > 0 ? "Поточні фото" : ""}
                {space.image_urls.length > 0 && newImages.length > 0
                  ? " та "
                  : ""}
                {newImages.length > 0 ? "Нові фото" : ""} (
                {space.image_urls.length + newImages.length})
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {space.image_urls.map((image, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <img
                      src={image}
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

                {newImages.map((image, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Нове фото ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
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

          {/* Upload Error */}
          {uploadError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {uploadError}
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <div className="text-xs text-gray-500 mt-1">
                Завантаження: {uploadProgress}%
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                loading ? "bg-green-400" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? (
                <>
                  <LoadingSpinner small className="mr-2" />
                  {uploadProgress > 0
                    ? `Завантаження ${uploadProgress}%`
                    : "Збереження..."}
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
