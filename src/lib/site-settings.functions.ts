import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { mergeSiteSettings } from "@/lib/site-settings.shared";

export const getPublicSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("site_settings").select("key,value");

  if (error) {
    throw new Error(error.message);
  }

  return mergeSiteSettings((data ?? []) as Array<{ key: string; value: string | null }>);
});