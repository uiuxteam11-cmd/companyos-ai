'use client';

import { LiveblocksProvider } from '@liveblocks/react';

export function Providers({ children }: { children: React.ReactNode }) {
  const liveblocksKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;

  if (!liveblocksKey) {
    return <>{children}</>;
  }

  return <LiveblocksProvider publicApiKey={liveblocksKey}>{children}</LiveblocksProvider>;
}
