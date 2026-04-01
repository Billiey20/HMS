import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext({
  isLoading: false,
  setLoading: () => {},
});

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback((val) => {
    setIsLoading(val);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
