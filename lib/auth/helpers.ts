import type { User } from "@/types/auth";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
