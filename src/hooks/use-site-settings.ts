import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  site_name: string;
  logo_url: string;
  hero_title: string;
  hero_subtitle: string;
  search_placeholder: string;
  footer_text: string;
  meta_description: string;
};

const DEFAULTS: SiteSettings = {
  site_name: "极客软件目录",
  logo_url: "",
  hero_title: "极客软件目录",
  hero_subtitle: "精选软件、网站与教程，点击名称即可查看对应文章",
  search_placeholder: "搜索软件名称或说明...",
  footer_text: "© 极客软件目录",
  meta_description: "精选软件、网站与教程目录",
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    enabled: typeof window !== "undefined",
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase.from("site_settings").select("key,value");
      if (error) throw error;
      const map = { ...DEFAULTS };
      for (const row of data ?? []) {
        if (row.key in map) (map as any)[row.key] = row.value ?? "";
      }
      return map;
    },
  });
}

