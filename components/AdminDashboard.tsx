"use client";

import { Check, LogOut, PowerOff, RefreshCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminSubmission = {
  id: string;
  name: string;
  brand: string | null;
  address: string;
  ward: string | null;
  district: string | null;
  province: string;
  latitude: number;
  longitude: number;
  notes: string | null;
  submitterName: string | null;
  submitterContact: string | null;
  photoUrl: string | null;
  sourceUrl: string | null;
  createdAt: string;
};

type AdminStation = {
  id: string;
  name: string;
  address: string;
  province: string;
  status: "ACTIVE" | "INACTIVE";
  updatedAt: string;
};

type AdminDashboardProps = {
  submissions: AdminSubmission[];
  stations: AdminStation[];
};

export function AdminDashboard({ submissions, stations }: AdminDashboardProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function postJson(path: string, body?: unknown) {
    setBusyId(path);
    setError(null);
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = (await response.json()) as { success: boolean; error?: string };
    setBusyId(null);
    if (!payload.success) {
      setError(payload.error ?? "Thao tác thất bại");
      return false;
    }
    router.refresh();
    return true;
  }

  async function logout() {
    await postJson("/api/admin/logout");
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--primary)]">Bảng kiểm duyệt</p>
            <h1 className="text-3xl font-black">Cây xăng A97</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="a97-button secondary" type="button" onClick={() => router.refresh()}>
              <RefreshCcw size={18} aria-hidden />
              Làm mới
            </button>
            <button className="a97-button secondary" type="button" onClick={logout}>
              <LogOut size={18} aria-hidden />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)]">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <h2 className="text-xl font-black">Đề xuất chờ duyệt ({submissions.length})</h2>
          </div>
          <div className="grid gap-4 p-4">
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                {error}
              </p>
            ) : null}
            {submissions.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Không có đề xuất đang chờ.</p>
            ) : (
              submissions.map((submission) => (
                <ModerationItem
                  key={submission.id}
                  submission={submission}
                  busyId={busyId}
                  onApprove={(payload) =>
                    postJson(`/api/admin/submissions/${submission.id}/approve`, payload)
                  }
                  onReject={(moderationNotes) =>
                    postJson(`/api/admin/submissions/${submission.id}/reject`, {
                      moderationNotes
                    })
                  }
                />
              ))
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-[var(--line)] bg-[var(--panel)]">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <h2 className="text-xl font-black">Dữ liệu hiện có ({stations.length})</h2>
          </div>
          <div className="max-h-[720px] overflow-auto">
            {stations.map((station) => (
              <div key={station.id} className="border-b border-[var(--line)] p-4 last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{station.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{station.address}</p>
                    <p className="mt-1 text-xs font-bold text-[var(--primary)]">
                      {station.province} · {station.status}
                    </p>
                  </div>
                  {station.status === "ACTIVE" ? (
                    <button
                      className="a97-button secondary"
                      type="button"
                      onClick={() => postJson(`/api/admin/stations/${station.id}/deactivate`)}
                    >
                      <PowerOff size={16} aria-hidden />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function ModerationItem({
  submission,
  busyId,
  onApprove,
  onReject
}: {
  submission: AdminSubmission;
  busyId: string | null;
  onApprove: (payload: Record<string, unknown>) => Promise<boolean>;
  onReject: (moderationNotes: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState({
    name: submission.name,
    brand: submission.brand ?? "",
    address: submission.address,
    ward: submission.ward ?? "",
    district: submission.district ?? "",
    province: submission.province,
    latitude: submission.latitude,
    longitude: submission.longitude,
    notes: submission.notes ?? "",
    moderationNotes: ""
  });

  function update(key: keyof typeof draft, value: string | number) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-4">
      <div className="mb-4">
        <p className="text-sm font-bold text-[var(--primary)]">
          Gửi lúc {new Intl.DateTimeFormat("vi-VN").format(new Date(submission.createdAt))}
        </p>
        <h3 className="text-lg font-black">{submission.name}</h3>
        {submission.submitterContact ? (
          <p className="mt-1 text-sm text-[var(--muted)]">Liên hệ: {submission.submitterContact}</p>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="a97-label md:col-span-2">
          Tên
          <input
            className="a97-input"
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </label>
        <label className="a97-label">
          Thương hiệu
          <input
            className="a97-input"
            value={draft.brand}
            onChange={(event) => update("brand", event.target.value)}
          />
        </label>
        <label className="a97-label">
          Tỉnh/thành
          <input
            className="a97-input"
            value={draft.province}
            onChange={(event) => update("province", event.target.value)}
          />
        </label>
        <label className="a97-label md:col-span-2">
          Địa chỉ
          <input
            className="a97-input"
            value={draft.address}
            onChange={(event) => update("address", event.target.value)}
          />
        </label>
        <label className="a97-label">
          Vĩ độ
          <input
            className="a97-input"
            type="number"
            step="0.000001"
            value={draft.latitude}
            onChange={(event) => update("latitude", Number(event.target.value))}
          />
        </label>
        <label className="a97-label">
          Kinh độ
          <input
            className="a97-input"
            type="number"
            step="0.000001"
            value={draft.longitude}
            onChange={(event) => update("longitude", Number(event.target.value))}
          />
        </label>
        <label className="a97-label md:col-span-2">
          Ghi chú kiểm duyệt
          <textarea
            className="a97-input min-h-[84px]"
            value={draft.moderationNotes}
            onChange={(event) => update("moderationNotes", event.target.value)}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="a97-button"
          type="button"
          disabled={Boolean(busyId)}
          onClick={() => onApprove(draft)}
        >
          <Check size={18} aria-hidden />
          Duyệt
        </button>
        <button
          className="a97-button secondary"
          type="button"
          disabled={Boolean(busyId)}
          onClick={() => onReject(draft.moderationNotes)}
        >
          <X size={18} aria-hidden />
          Từ chối
        </button>
      </div>
    </article>
  );
}
