import React, { useEffect, useState } from 'react';

interface ErrorNotificationProps {
  error: string | null;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  type?: 'error' | 'warning' | 'info';
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onClose,
  autoClose = true,
  duration = 5000,
  type = 'error'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setIsClosing(false);

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoClose, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  if (!error || !isVisible) {
    return null;
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          border: 'border-yellow-600',
          text: 'text-yellow-100',
          icon: '⚠️'
        };
      case 'info':
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-600',
          text: 'text-blue-100',
          icon: 'ℹ️'
        };
      default:
        return {
          bg: 'bg-red-500',
          border: 'border-red-600',
          text: 'text-red-100',
          icon: '❌'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`
          ${styles.bg} ${styles.border} ${styles.text}
          border-l-4 p-4 rounded-lg shadow-lg max-w-md
          transform transition-all duration-300 ease-in-out
          ${isClosing ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        `}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-lg">{styles.icon}</span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">
              {error}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={`
                ${styles.text} hover:opacity-75 transition-opacity
                focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
                rounded-full p-1
              `}
            >
              <span className="sr-only">Fechar</span>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorNotification;