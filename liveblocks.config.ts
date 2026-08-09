import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

const client = createClient({
  // We use a dummy auth endpoint for the MVP to keep it simple
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
});

export const {
  RoomProvider,
  useOthers,
  useSelf,
  useUpdatePresence,
} = createRoomContext(client);