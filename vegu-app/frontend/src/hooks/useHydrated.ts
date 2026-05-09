import { useEffect, useState } from 'react';

// Guards against Zustand SSR/CSR hydration mismatch.
// Use before reading any persisted store value that isn't safe on the server.
export const useHydrated = (): boolean => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  return hydrated;
};
