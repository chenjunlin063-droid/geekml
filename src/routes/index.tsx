import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Category = { id: string; name: string; sort_order: number };
type Software = { id: string; category_id: string; name: string; url: string; description: string | null; sort_order: number };

function Index() {
  const [q, setQ] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: softwares } = useQuery({
    queryKey: ["softwares"],
    queryFn: async () => {
      const { data, error } = await supabase.from("softwares").select("*").order("sort_order").limit(2000);
      if (error) throw error;
      return data as Software[];
    },
  });

  const grouped = useMemo(() => {
    if (!categories || !softwares) return [];
    const kw = q.trim().toLowerCase();
    return categories
      .map((c) => ({
        category: c,
        items: softwares
          .filter((s) => s.category_id === c.id)
          .filter((s) =>
            kw
              ? s.name.toLowerCase().includes(kw) ||
                (s.description ?? "").toLowerCase().includes(kw)
              : true
          ),
      }))
      .filter((g) => g.items.length > 0);
  }, [categories, softwares, q]);

  const total = softwares?.length ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          极客软件目录
        </h1>
        <p className="mt-2 text-muted-foreground">
          精选 {total} 款软件、网站与教程，点击名称即可查看对应文章
        </p>
        <div className="mt-5 relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索软件名称或说明..."
            className="pl-9"
          />
        </div>
      </section>

      <nav className="mb-6 flex flex-wrap gap-2 justify-center">
        {(categories ?? []).map((c) => (
          <a
            key={c.id}
            href={`#cat-${c.id}`}
            className="text-xs px-3 py-1 rounded-full border bg-card hover:bg-accent transition"
          >
            {c.name}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        {grouped.map(({ category, items }) => (
          <section key={category.id} id={`cat-${category.id}`}>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <span className="inline-block w-1 h-5 bg-primary rounded" />
              {category.name}
              <span className="text-xs font-normal text-muted-foreground">
                共 {items.length} 项
              </span>
            </h2>
            <div className="rounded-lg border overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">序号</TableHead>
                    <TableHead>软件 / 资源名称</TableHead>
                    <TableHead className="hidden md:table-cell">说明</TableHead>
                    <TableHead className="w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium break-all"
                        >
                          {s.name}
                        </a>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {s.description || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded border hover:bg-accent inline-block"
                        >
                          查看
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ))}
        {grouped.length === 0 && q && (
          <div className="text-center text-muted-foreground py-12">
            没有找到匹配 "{q}" 的内容
          </div>
        )}
      </div>
    </main>
  );
}
