import { useEffect } from "react";

interface NotificationProps {
  message: string;
  onClose: () => void;
  duration?: number; // in ms
}

export default function Notification({ message, onClose, duration = 1000 }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
  <div className="fixed right-auto  md:right-1 md:bottom-5 z-50 bg-zinc-800 text-white px-4 py-2 rounded-lg shadow-lg border border-green-500 fade-in-down">
  <span className="text-sm">{message}</span>
</div>
  );
}
