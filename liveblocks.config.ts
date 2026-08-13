'use client';

import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

type Presence = {
  name?: string;
  color?: string;
  isTyping?: boolean;
  cursor?: { x: number; y: number };
  lastAction?: string;
};

type BoardNode = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  title: string;
  authorName: string;
  color: string;
  x: number;
  y: number;
  createdAt: number;
};

type Storage = {
  board: {
    nodes: BoardNode[];
    updatedAt: number;
  };
};

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY ?? '',
});

export const {
  RoomProvider,
  useOthers,
  useSelf,
  useMyPresence,
  useMutation,
  useStorage,
  useRoom,
} = createRoomContext<Presence, Storage>(client);