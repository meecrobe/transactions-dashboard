'use client';

import { useEffect, useState } from 'react';

async function initMocks() {
  if (typeof window === 'undefined') {
    return;
  }

  const { worker } = await import('@/mocks/browser');

  await worker.start({ onUnhandledRequest: 'bypass' });
}

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      await initMocks();
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
