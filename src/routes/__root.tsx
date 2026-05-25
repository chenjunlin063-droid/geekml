import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="inline-block size-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-sm">极</span>
              极客软件馆
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link to="/" className="hover:text-primary [&.active]:text-primary">首页</Link>
              <Link to="/admin" className="hover:text-primary [&.active]:text-primary">后台</Link>
            </nav>
          </div>
        </header>
        <Outlet />
        <footer className="border-t mt-12 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} 极客软件馆 · 持续更新
        </footer>
      </div>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
