import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";

import type { GameState } from "../types";

const SUPABASE_URL = "https://bjomcfrsmahrpnjnouyj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb21jZnJzbWFocnBuam5vdXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MzA5MDIsImV4cCI6MjEwNDQwNjkwMn0.uTQDR6o2oeXt4IxaHYdcUIEwIjUYxsiJ8GWYURBhvwE";

export type RoomRow = {
  code: string;
  password: string;
  host_token: string;
  state: GameState;
  created_at: string;
  updated_at: string;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
