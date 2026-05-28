"use client";

import { Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const payload = (await response.json()) as { success: boolean; error?: string };

    setIsLoading(false);
    if (!payload.success) {
      setError(payload.error ?? "Không thể đăng nhập");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      className="grid w-full max-w-md gap-4 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm"
      onSubmit={submit}
    >
      <div>
        <p className="text-sm font-bold text-[var(--primary)]">Quản trị A97</p>
        <h1 className="text-2xl font-black">Đăng nhập kiểm duyệt</h1>
      </div>
      <label className="a97-label">
        Tài khoản
        <input
          className="a97-input"
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>
      <label className="a97-label">
        Mật khẩu
        <input
          className="a97-input"
          autoComplete="current-password"
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}
      <button className="a97-button" type="submit" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" size={18} aria-hidden /> : <LogIn size={18} aria-hidden />}
        Đăng nhập
      </button>
    </form>
  );
}
