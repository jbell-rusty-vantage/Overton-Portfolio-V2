"use client";

interface CustomAlertProps {
  children: React.ReactNode;
}

export const CustomAlert = ({ children }: CustomAlertProps) => (
  <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 text-blue-700 dark:text-blue-300 px-4 py-3 rounded relative mb-4">
    <strong className="font-bold">Info:</strong>
    <span className="block sm:inline ml-2">{children}</span>
  </div>
);
