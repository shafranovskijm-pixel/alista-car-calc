// Клиент backend через ваш Nginx-прокси (api.alistaru.ru).
// Используется во всём приложении, чтобы сайт работал без VPN.
// Авто-сгенерированный client.ts намеренно не трогаем.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const PROXY_URL = "https://api.alistaru.ru";
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient<Database>(PROXY_URL, PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});