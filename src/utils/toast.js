import { toast } from 'react-toastify';

const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(e => {
      console.warn('Autoplay prevented or sound file missing at /sounds/notification.mp3');
    });
  } catch (e) {
    console.error('Audio playback initialization failed:', e);
  }
};

export const notify = {
  success: (msg, options = {}) => {
    playNotificationSound();
    toast.success(msg, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
      ...options,
    });
  },
  error: (msg, options = {}) => {
    playNotificationSound();
    toast.error(msg, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
      ...options,
    });
  },
  info: (msg, options = {}) => {
    playNotificationSound();
    toast.info(msg, {
      position: "top-right",
      autoClose: 3000,
      ...options,
    });
  },
  warn: (msg, options = {}) => {
    playNotificationSound();
    toast.warn(msg, {
      position: "top-right",
      autoClose: 4000,
      ...options,
    });
  },
  testSound: () => {
    playNotificationSound();
  }
};
