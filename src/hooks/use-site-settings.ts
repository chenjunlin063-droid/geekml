import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPublicSiteSettings } from "@/lib/site-settings.functions";
import type { SiteSettings } from "@/lib/site-settings.shared";

export const siteSettingsQueryOptions = queryOptions({
  queryKey: ["site_settings"],
  staleTime: 60_000,
  queryFn: (): Promise<SiteSettings> => getPublicSiteSettings(),
});

export function useSiteSettings() {
  return useSuspenseQuery(siteSettingsQueryOptions);
}
