import React from "react";

export default function LoadingSpinner({ fullPage = false, small = false }) {
  const sizeClasses = small ? "h-3 w-3" : "h-6 w-6";

  return (
    <div
      className={`flex items-center justify-center ${
        fullPage ? "h-screen" : "h-full"
      }`}
    >
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 border-green-500 ${sizeClasses}`}
      ></div>
    </div>
  );
}
