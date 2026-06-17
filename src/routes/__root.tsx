import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { siteSettingsQueryOptions, useSiteSettings } from "@/hooks/use-site-settings";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">页面未找到</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            回到首页
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">页面加载失败</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            重试
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQueryOptions),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "极客软件馆 - 精品软件目录" },
      { name: "description", content: "极客软件馆，精品软件、网站、教程目录，持续更新。" },
      { property: "og:title", content: "极客软件馆 - 精品软件目录" },
      { name: "twitter:title", content: "极客软件馆 - 精品软件目录" },
      { property: "og:description", content: "极客软件馆，精品软件、网站、教程目录，持续更新。" },
      { name: "twitter:description", content: "极客软件馆，精品软件、网站、教程目录，持续更新。" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/aace4dc4-533b-4391-a2b1-d4e94a6bd4cd/id-preview-eb4e94af--8034846c-24b7-4b82-9caf-0c365c86039b.lovable.app-1779715383184.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/aace4dc4-533b-4391-a2b1-d4e94a6bd4cd/id-preview-eb4e94af--8034846c-24b7-4b82-9caf-0c365c86039b.lovable.app-1779715383184.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const SOCIAL_ICONS: Record<string, string> = {
  qq: "M12 2C7.03 2 3 6.03 3 11c0 2.5 1.02 4.76 2.66 6.39-.18.66-.6 1.84-1.21 2.61-.18.23-.02.55.27.5 1.36-.22 2.61-.74 3.43-1.16.95.42 1.99.66 3.07.66 4.97 0 9-4.03 9-9s-4.03-9-9-9z",
  wechat: "M8.5 5C4.91 5 2 7.46 2 10.5c0 1.76 1 3.33 2.54 4.36L4 17l2.3-1.18c.66.13 1.36.2 2.08.2.16 0 .32-.01.47-.02-.16-.5-.25-1.02-.25-1.55 0-2.97 2.86-5.38 6.4-5.38.18 0 .35.01.53.02C14.96 6.61 12.04 5 8.5 5zm-2 3a.75.75 0 110 1.5.75.75 0 010-1.5zm4 0a.75.75 0 110 1.5.75.75 0 010-1.5zm5.5 2.5c-3.04 0-5.5 2.01-5.5 4.5s2.46 4.5 5.5 4.5c.6 0 1.18-.08 1.72-.23L20 20l-.43-1.35c1.5-.83 2.43-2.16 2.43-3.65 0-2.49-2.46-4.5-5.5-4.5zm-1.75 2a.6.6 0 110 1.2.6.6 0 010-1.2zm3.5 0a.6.6 0 110 1.2.6.6 0 010-1.2z",
  bilibili: "M17.8 3.5l-1.4 1.4-2-2H9.6l-2 2L6.2 3.5 4.8 4.9l1.4 1.4H5a3 3 0 00-3 3v7a3 3 0 003 3h14a3 3 0 003-3v-7a3 3 0 00-3-3h-1.2l1.4-1.4-1.4-1.4zM8 11a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zm8 0a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z",
  official: "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 4v10h16V8l-8 5-8-5zm0-2l8 5 8-5H4z",
};

type SocialItem = {
  key: string;
  label: string;
  value: string;
  mode: string;
  qr: string;
  desc: string;
  icon: string;
};

export function SocialLinks() {
  const { data: settings } = useSiteSettings();
  const [openItem, setOpenItem] = useState<SocialItem | null>(null);

  const items: SocialItem[] = [
    { key: "qq", label: "QQ", value: settings.social_qq, mode: settings.social_qq_mode, qr: settings.social_qq_qr, desc: settings.social_qq_desc, icon: settings.social_qq_icon },
    { key: "wechat", label: "微信", value: settings.social_wechat, mode: settings.social_wechat_mode, qr: settings.social_wechat_qr, desc: settings.social_wechat_desc, icon: settings.social_wechat_icon },
    { key: "bilibili", label: "哔哩哔哩", value: settings.social_bilibili, mode: settings.social_bilibili_mode, qr: settings.social_bilibili_qr, desc: settings.social_bilibili_desc, icon: settings.social_bilibili_icon },
    { key: "official", label: "公众号", value: settings.social_official, mode: settings.social_official_mode, qr: settings.social_official_qr, desc: settings.social_official_desc, icon: settings.social_official_icon },
  ].filter((i) => i.value || i.qr);

  if (items.length === 0) return null;

  return (
    <>
      <div className="flex justify-center gap-3 mb-3">
        {items.map((i) => {
          const isQrMode = i.mode === "qr";
          const isUrl = /^https?:\/\//i.test(i.value);

          const inner = (
            <span
              className="inline-flex items-center justify-center size-9 rounded-full border bg-card text-muted-foreground hover:text-primary hover:border-primary transition overflow-hidden"
              title={i.label}
              aria-label={i.label}
            >
              {i.icon ? (
                <img src={i.icon} alt={i.label} className="size-5 object-contain" />
              ) : (
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                  <path d={SOCIAL_ICONS[i.key]} />
                </svg>
              )}
            </span>
          );

          if (isQrMode || !isUrl) {
            return (
              <button
                key={i.key}
                type="button"
                onClick={() => setOpenItem(i)}
                className="cursor-pointer"
              >
                {inner}
              </button>
            );
          }
          return (
            <a key={i.key} href={i.value} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          );
        })}
      </div>

      <Dialog open={!!openItem} onOpenChange={(o) => !o && setOpenItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{openItem?.label}</DialogTitle>
          </DialogHeader>
          {openItem && (
            <div className="flex flex-col items-center gap-3 text-center">
              {openItem.qr ? (
                <img src={openItem.qr} alt={`${openItem.label} 二维码`} className="size-56 object-contain rounded border bg-card p-2" />
              ) : null}
              {openItem.value ? (
                <div className="text-sm text-foreground break-all">{openItem.value}</div>
              ) : null}
              {openItem.desc ? (
                <p className="text-xs text-muted-foreground whitespace-pre-line">{openItem.desc}</p>
              ) : null}
              {!openItem.qr && !openItem.desc && !openItem.value && (
                <p className="text-xs text-muted-foreground">暂无内容</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SiteChrome() {
  const { data: settings } = useSiteSettings();
  const siteName = settings.site_name || "极客软件馆";
  const showHeaderLogo = settings.hide_header_logo !== "1";
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-base">
            {showHeaderLogo ? (
              settings.logo_url ? (
                <img src={settings.logo_url} alt={siteName} className="size-7 rounded-full object-cover" />
              ) : (
                <span className="inline-block size-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm">
                  {siteName.charAt(0)}
                </span>
              )
            ) : null}
            {siteName}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:text-primary [&.active]:text-primary">首页</Link>
            <Link to="/admin" className="hover:text-primary [&.active]:text-primary">后台</Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-t mt-12 py-6 text-center text-xs text-muted-foreground">
        <SocialLinks />
        © {new Date().getFullYear()} {siteName} · 持续更新
      </footer>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <SiteChrome />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
