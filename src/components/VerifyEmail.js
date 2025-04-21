import { useEffect, useState } from "react";

export default function VerifyEmail() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("verify_token");
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    if (token) {
      setIsVerifying(true);
    }

    fetch(`${API_BASE_URL}/api/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          setResultMessage("✅ Email підтверджено! Тепер увійдіть.");
        } else {
          setResultMessage("❌ Невалідний або прострочений токен.");
        }
      })
      .catch(() => {
        setResultMessage("⚠️ Помилка при верифікації токена.");
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, []);

  return { isVerifying, resultMessage };
}
