import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password: pwd,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("注册成功！请查收邮件验证后再登录。");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
        if (error) throw error;
        toast.success("登录成功");
        navigate({ to: "/admin" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "signin" ? "管理员登录" : "注册新账号"}</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "登录后可在后台管理软件目录"
              : "第一个注册的账号将自动成为管理员"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>密码</Label>
              <Input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "处理中..." : mode === "signin" ? "登录" : "注册"}
            </Button>
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="block w-full text-sm text-muted-foreground hover:text-primary"
            >
              {mode === "signin" ? "没有账号？去注册" : "已有账号？去登录"}
            </button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
