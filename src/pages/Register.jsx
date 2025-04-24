import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const errors = {};

    // Validate username (first and last name)

    // Password validation
    if (
      !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,}$/.test(
        formData.password,
      )
    ) {
      errors.password =
        "Пароль має містити мінімум 5 символів, цифру, спецсимвол і латинські літери.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      await signUp(formData);
      navigate("/spaces");
    } catch (error) {
      console.error("Registration error:", error);

      if (error.detail) {
        const serverErrors = {};
        error.detail.forEach((err) => {
          const field = err.loc[1];
          serverErrors[field] = err.msg;
        });
        setFieldErrors(serverErrors);
      } else {
        setError(error.message || "Помилка реєстрації");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white p-8 rounded-lg shadow-sm mt-[210px]">
        <h2 className="text-2xl font-bold text-center mb-6 mb-[40px]">
          Реєстрація
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ім'я та прізвище
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 pl-2 py-2 ${
                fieldErrors.username ? "border-red-500" : ""
              }`}
              required
              placeholder="Ім'я та прізвище"
            />

            {fieldErrors.username && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 pl-2 py-2 ${
                fieldErrors.email ? "border-red-500" : ""
              }`}
              required
              placeholder="user@mail.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Пароль
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 pl-2 py-2 ${
                fieldErrors.password ? "border-red-500" : ""
              }`}
              required
              minLength={5}
              placeholder="Введіть пароль"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner small /> : "Зареєструватися"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Вже є акаунт?{" "}
          <Link to="/login" className="text-green-600 hover:text-green-500">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
