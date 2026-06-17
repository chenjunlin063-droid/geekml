export type SiteSettings = {
  site_name: string;
  logo_url: string;
  hero_title: string;
  hero_subtitle: string;
  hero_extra_html: string;
  search_placeholder: string;
  footer_text: string;
  meta_description: string;
  social_qq: string;
  social_wechat: string;
  social_bilibili: string;
  social_official: string;
  social_qq_mode: string;
  social_wechat_mode: string;
  social_bilibili_mode: string;
  social_official_mode: string;
  social_qq_qr: string;
  social_wechat_qr: string;
  social_bilibili_qr: string;
  social_official_qr: string;
  social_qq_desc: string;
  social_wechat_desc: string;
  social_bilibili_desc: string;
  social_official_desc: string;
  social_qq_icon: string;
  social_wechat_icon: string;
  social_bilibili_icon: string;
  social_official_icon: string;
  promo_text: string;
  promo_url: string;
  home_layout: string;
  card_mobile_columns: string;
  disclaimer_text: string;
  hide_header_logo: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "极客软件馆",
  logo_url: "",
  hero_title: "极客软件馆",
  hero_subtitle: "精选软件、网站与教程，点击名称即可查看对应文章",
  hero_extra_html: "",
  search_placeholder: "搜索软件名称或说明...",
  footer_text: "© 极客软件馆",
  meta_description: "精选软件、网站与教程目录",
  social_qq: "",
  social_wechat: "",
  social_bilibili: "",
  social_official: "",
  social_qq_mode: "link",
  social_wechat_mode: "qr",
  social_bilibili_mode: "link",
  social_official_mode: "qr",
  social_qq_qr: "",
  social_wechat_qr: "",
  social_bilibili_qr: "",
  social_official_qr: "",
  social_qq_desc: "",
  social_wechat_desc: "",
  social_bilibili_desc: "",
  social_official_desc: "",
  social_qq_icon: "",
  social_wechat_icon: "",
  social_bilibili_icon: "",
  social_official_icon: "",
  promo_text: "",
  promo_url: "",
  home_layout: "default",
  card_mobile_columns: "1",
  disclaimer_text: "",
  hide_header_logo: "1",
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
