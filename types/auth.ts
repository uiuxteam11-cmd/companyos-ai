export type User = {
  id: string;
  email?: string | null;
  role?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};
