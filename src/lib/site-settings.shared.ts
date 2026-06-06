export type SiteSettings = {
  site_name: string;
  logo_url: string;
  hero_title: string;
  hero_subtitle: string;
  search_placeholder: string;
  footer_text: string;
  meta_description: string;
  social_qq: string;
  social_wechat: string;
  social_bilibili: string;
  social_official: string;
  promo_text: string;
  promo_url: string;
  home_layout: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "极客软件馆",
  logo_url: "",
  hero_title: "极客软件馆",
  hero_subtitle: "精选软件、网站与教程，点击名称即可查看对应文章",
  search_placeholder: "搜索软件名称或说明...",
  footer_text: "© 极客软件馆",
  meta_description: "精选软件、网站与教程目录",
  social_qq: "",
  social_wechat: "",
  social_bilibili: "",
  social_official: "",
  promo_text: "",
  promo_url: "",
};

export function mergeSiteSettings(
  rows: Array<{ key: string; value: string | null }> | null | undefined,
): SiteSettings {
  const settings: SiteSettings = { ...DEFAULT_SETTINGS };

  for (const row of rows ?? []) {
    if (row.key in settings) {
      (settings as Record<string, string>)[row.key] = row.value ?? "";
    }
  }

  return settings;
}