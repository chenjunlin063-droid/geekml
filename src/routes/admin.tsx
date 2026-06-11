import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

type Category = { id: string; name: string; sort_order: number };
type Software = { id: string; category_id: string; name: string; url: string; description: string | null; sort_order: number; icon_url: string | null };


function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">加载中...</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-xl font-semibold">无管理权限</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          当前账号不是管理员。请使用管理员账号登录。
        </p>
        <Button className="mt-4" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); }}>
          退出登录
        </Button>
      </main>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

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

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["softwares"] });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="logo" className="h-8 w-auto" />
          ) : null}
          <div>
            <h1 className="text-2xl font-bold leading-none">{settings?.site_name || "后台管理"}</h1>
            <p className="text-xs text-muted-foreground mt-1">管理中心</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary self-center">← 返回首页</Link>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4 mr-1" /> 退出
          </Button>
        </div>
      </div>

      <Tabs defaultValue="softwares">
        <TabsList>
          <TabsTrigger value="softwares">软件 ({softwares?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="categories">分类 ({categories?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="site">界面设置</TabsTrigger>
        </TabsList>

        <TabsContent value="softwares" className="mt-4">
          <SoftwareManager categories={categories ?? []} softwares={softwares ?? []} onChange={refresh} />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoryManager categories={categories ?? []} onChange={refresh} />
        </TabsContent>
        <TabsContent value="site" className="mt-4">
          <SiteSettingsManager />
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* ------------------- Software manager ------------------- */
function SoftwareManager({
  categories,
  softwares,
  onChange,
}: {
  categories: Category[];
  softwares: Software[];
  onChange: () => void;
}) {
  const [editing, setEditing] = useState<Software | null>(null);
  const [open, setOpen] = useState(false);
  const [presetCatId, setPresetCatId] = useState<string | null>(null);

  const startCreate = (catId?: string) => {
    setEditing(null);
    setPresetCatId(catId ?? null);
    setOpen(true);
  };
  const startEdit = (s: Software) => {
    setEditing(s);
    setPresetCatId(null);
    setOpen(true);
  };

  async function remove(id: string) {
    if (!confirm("确定删除这条软件？")) return;
    const { error } = await supabase.from("softwares").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("已删除");
    onChange();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>软件列表</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => startCreate()}>
              <Plus className="size-4 mr-1" /> 新增软件
            </Button>
          </DialogTrigger>
          <SoftwareDialog
            key={editing?.id ?? presetCatId ?? "new"}
            categories={categories}
            initial={editing}
            presetCategoryId={presetCatId}
            onSaved={() => {
              setOpen(false);
              onChange();
            }}
          />
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {categories.map((cat) => {
            const items = softwares.filter((s) => s.category_id === cat.id);
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-1 h-4 bg-primary rounded" />
                    <h3 className="font-semibold">{cat.name}</h3>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => startCreate(cat.id)}>
                    <Plus className="size-4 mr-1" /> 添加到此分类
                  </Button>
                </div>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">图标</TableHead>
                        <TableHead>名称</TableHead>
                        <TableHead className="hidden md:table-cell">链接</TableHead>
                        <TableHead className="w-20">排序</TableHead>
                        <TableHead className="w-28 text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground text-sm">
                            暂无软件
                          </TableCell>
                        </TableRow>
                      )}
                      {items.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            {s.icon_url ? (
                              <img src={s.icon_url} alt="" className="size-7 rounded object-contain border bg-card" />
                            ) : (
                              <div className="size-7 rounded border bg-muted/50 grid place-items-center text-[10px] text-muted-foreground">
                                {s.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                            {s.url}
                          </TableCell>
                          <TableCell>{s.sort_order}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" onClick={() => startEdit(s)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => remove(s.id)}>
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">请先在"分类"标签页新增分类</div>
          )}
        </div>
      </CardContent>

    </Card>
  );
}

function SoftwareDialog({
  categories,
  initial,
  presetCategoryId,
  onSaved,
}: {
  categories: Category[];
  initial: Software | null;
  presetCategoryId?: string | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [catId, setCatId] = useState(initial?.category_id ?? presetCategoryId ?? categories[0]?.id ?? "");
  const [sort, setSort] = useState(initial?.sort_order ?? 0);
  const [iconUrl, setIconUrl] = useState(initial?.icon_url ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadIcon(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `icon-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    setIconUrl(data.publicUrl);
    setUploading(false);
  }

  async function save() {
    if (!name || !url || !catId) return toast.error("请填写完整信息");
    setBusy(true);
    const payload = { name, url, description: desc, category_id: catId, sort_order: Number(sort) || 0, icon_url: iconUrl || null };
    const { error } = initial
      ? await supabase.from("softwares").update(payload).eq("id", initial.id)
      : await supabase.from("softwares").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "已更新" : "已添加");
    onSaved();
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{initial ? "编辑软件" : "新增软件"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>图标</Label>
          <div className="flex items-center gap-3 mt-1">
            {iconUrl ? (
              <img src={iconUrl} alt="" className="size-10 rounded border bg-card object-contain p-0.5" />
            ) : (
              <div className="size-10 rounded border bg-muted/40 grid place-items-center text-xs text-muted-foreground">无</div>
            )}
            <Input
              type="file"
              accept="image/*"
              className="max-w-xs"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadIcon(f); }}
            />
            {iconUrl && (
              <Button variant="ghost" size="sm" onClick={() => setIconUrl("")}>移除</Button>
            )}
          </div>
          <Input
            className="mt-2"
            placeholder="或直接粘贴图标 URL"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
          />
        </div>
        <div>
          <Label>名称</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>链接 URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <Label>说明（可选）</Label>
          <Input value={desc ?? ""} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>分类</Label>
            <Select value={catId} onValueChange={setCatId}>
              <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>排序</Label>
            <Input type="number" value={sort} onChange={(e) => setSort(Number(e.target.value))} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button disabled={busy} onClick={save}>{busy ? "保存中..." : "保存"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}


/* ------------------- Category manager ------------------- */
function CategoryManager({ categories, onChange }: { categories: Category[]; onChange: () => void }) {
  const [name, setName] = useState("");
  const [sort, setSort] = useState(0);

  async function add() {
    if (!name) return;
    const { error } = await supabase.from("categories").insert({ name, sort_order: sort });
    if (error) return toast.error(error.message);
    setName(""); setSort(0);
    toast.success("已新增");
    onChange();
  }

  async function update(c: Category, patch: Partial<Category>) {
    const { error } = await supabase.from("categories").update(patch).eq("id", c.id);
    if (error) return toast.error(error.message);
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("删除分类会同时删除其下的所有软件，确认？")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("已删除");
    onChange();
  }

  return (
    <Card>
      <CardHeader><CardTitle>分类管理</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 items-end mb-4">
          <div className="flex-1 min-w-[160px]">
            <Label>新增分类名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="w-24">
            <Label>排序</Label>
            <Input type="number" value={sort} onChange={(e) => setSort(Number(e.target.value))} />
          </div>
          <Button onClick={add}><Plus className="size-4 mr-1" /> 新增</Button>
        </div>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead className="w-32">排序</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <CategoryRow key={c.id} c={c} onUpdate={update} onDelete={remove} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryRow({
  c,
  onUpdate,
  onDelete,
}: {
  c: Category;
  onUpdate: (c: Category, patch: Partial<Category>) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(c.name);
  const [sort, setSort] = useState(c.sort_order);
  return (
    <TableRow>
      <TableCell>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== c.name && onUpdate(c, { name })}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={sort}
          onChange={(e) => setSort(Number(e.target.value))}
          onBlur={() => sort !== c.sort_order && onUpdate(c, { sort_order: sort })}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button size="icon" variant="ghost" onClick={() => onDelete(c.id)}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

/* ------------------- Site settings manager ------------------- */
function SiteSettingsManager() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["site_settings_admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key,value");
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const r of data ?? []) map[r.key] = r.value ?? "";
      return map;
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const current = { ...(settings ?? {}), ...form };

  const fields: { key: string; label: string; placeholder?: string; textarea?: boolean }[] = [
    { key: "site_name", label: "网站名称", placeholder: "极客软件馆" },
    { key: "hero_title", label: "首页大标题" },
    { key: "hero_subtitle", label: "首页副标题（可用 {count} 表示软件总数）" },
    { key: "search_placeholder", label: "搜索框占位文字" },
    { key: "footer_text", label: "页脚文字" },
    { key: "meta_description", label: "SEO 描述" },
    { key: "social_qq", label: "QQ（群链接或号码）", placeholder: "https://qm.qq.com/... 或 群号" },
    { key: "social_wechat", label: "微信（微信号或链接）", placeholder: "微信号 或 链接" },
    { key: "social_bilibili", label: "B 站主页链接", placeholder: "https://space.bilibili.com/..." },
    { key: "social_official", label: "公众号（名称或链接）", placeholder: "公众号名称 或 文章链接" },
    { key: "promo_text", label: "首页广告文字（留空则不显示）", placeholder: "🔥 限时活动：加入会员立享专属福利" },
    { key: "promo_url", label: "首页广告链接 URL（可选）", placeholder: "https://..." },
  ];

  async function uploadLogo(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    setForm((f) => ({ ...f, logo_url: data.publicUrl }));
    setUploading(false);
    toast.success("已上传，记得点击保存");
  }

  async function save() {
    setBusy(true);
    const rows = Object.entries(current).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("已保存");
    setForm({});
    qc.invalidateQueries({ queryKey: ["site_settings_admin"] });
    qc.invalidateQueries({ queryKey: ["site_settings"] });
  }

  if (isLoading) return <div className="text-muted-foreground text-sm">加载中...</div>;

  return (
    <Card>
      <CardHeader><CardTitle>界面与品牌设置</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Logo</Label>
          <div className="flex items-center gap-3 mt-1">
            {current.logo_url ? (
              <img src={current.logo_url} alt="logo" className="h-12 w-auto border rounded bg-card p-1" />
            ) : (
              <div className="h-12 w-12 border rounded flex items-center justify-center text-xs text-muted-foreground">无</div>
            )}
            <Input
              type="file"
              accept="image/*"
              className="max-w-xs"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }}
            />
            {current.logo_url && (
              <Button variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, logo_url: "" }))}>
                移除
              </Button>
            )}
          </div>
          <Input
            className="mt-2"
            placeholder="或直接粘贴 Logo URL"
            value={current.logo_url ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
          />
        </div>

        <div>
          <Label>首页样式</Label>
          <Select
            value={current.home_layout || "default"}
            onValueChange={(v) => setForm((s) => ({ ...s, home_layout: v }))}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">默认样式（表格列表）</SelectItem>
              <SelectItem value="compact">紧凑样式（参考灵气驿站）</SelectItem>
              <SelectItem value="card">卡片样式（双列表格，参考极客）</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">紧凑样式以小卡片网格形式展示软件，每个分类作为一个独立表格。</p>
        </div>



        {fields.map((f) => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <Input
              value={current[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          </div>
        ))}

        <Button disabled={busy} onClick={save}>{busy ? "保存中..." : "保存设置"}</Button>
      </CardContent>
    </Card>
  );
}
