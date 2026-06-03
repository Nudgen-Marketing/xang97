"use client";

import { Check, ChevronDown, ChevronRight, EyeOff, LogOut, RefreshCcw, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getStationStatusAction, type StationStatusAction } from "@/lib/admin-station-status";
import type { PaginationState } from "@/lib/pagination";

const DIRECTIONS_BASE_URL = "https://www.google.com/maps/dir/?api=1&travelmode=driving";

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
  pendingPagination: PaginationState;
  stationPagination: PaginationState;
  stations: AdminStation[];
};

export function AdminDashboard({
  submissions,
  pendingPagination,
  stationPagination,
  stations
}: AdminDashboardProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);
  const [pendingStationAction, setPendingStationAction] = useState<StationStatusAction | null>(
    null
  );

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

  async function confirmPendingStationAction() {
    if (!pendingStationAction) {
      return;
    }

    const succeeded = await postJson(pendingStationAction.path);
    if (succeeded) {
      setPendingStationAction(null);
    }
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
            <h2 className="text-xl font-black">
              Đề xuất chờ duyệt ({pendingPagination.totalCount})
            </h2>
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
              <div className="grid gap-3">
                {submissions.map((submission) => {
                  const isExpanded = submission.id === expandedSubmissionId;

                  return (
                    <ModerationItem
                      key={submission.id}
                      submission={submission}
                      busyId={busyId}
                      isExpanded={isExpanded}
                      onToggle={() =>
                        setExpandedSubmissionId((currentId) =>
                          currentId === submission.id ? null : submission.id
                        )
                      }
                      onApprove={(payload) =>
                        postJson(`/api/admin/submissions/${submission.id}/approve`, payload)
                      }
                      onReject={(moderationNotes) =>
                        postJson(`/api/admin/submissions/${submission.id}/reject`, {
                          moderationNotes
                        })
                      }
                    />
                  );
                })}
              </div>
            )}
            <AdminPagination
              ariaLabel="Phân trang đề xuất chờ duyệt"
              className="flex flex-col gap-3 border-t border-[var(--line)] pt-4 text-sm md:flex-row md:items-center md:justify-between"
              pagination={pendingPagination}
              hrefForPage={(page) =>
                adminPageHref({ page, stationPage: stationPagination.page })
              }
              noun="đề xuất"
            />
          </div>
        </div>

        <aside className="rounded-lg border border-[var(--line)] bg-[var(--panel)]">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <h2 className="text-xl font-black">
              Dữ liệu hiện có ({stationPagination.totalCount})
            </h2>
          </div>
          <div className="max-h-[720px] overflow-auto">
            {stations.map((station) => {
              const action = getStationStatusAction(station);
              const isActionBusy = busyId === action.path;

              return (
                <div key={station.id} className="border-b border-[var(--line)] p-4 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{station.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{station.address}</p>
                      <p className="mt-1 text-xs font-bold text-[var(--primary)]">
                        {station.province} · {station.status}
                      </p>
                    </div>
                    <button
                      aria-label={action.ariaLabel}
                      className="a97-button secondary min-w-11 px-3"
                      type="button"
                      disabled={isActionBusy}
                      onClick={() => setPendingStationAction(action)}
                    >
                      {action.kind === "activate" ? (
                        <RotateCcw size={16} aria-hidden />
                      ) : (
                        <EyeOff size={16} aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <AdminPagination
            ariaLabel="Phân trang dữ liệu hiện có"
            className="flex flex-col gap-3 border-t border-[var(--line)] p-4 text-sm md:flex-row md:items-center md:justify-between"
            pagination={stationPagination}
            hrefForPage={(stationPage) =>
              adminPageHref({ page: pendingPagination.page, stationPage })
            }
            noun="cây xăng"
          />
        </aside>
      </section>
      {pendingStationAction ? (
        <StationStatusConfirmDialog
          action={pendingStationAction}
          isBusy={busyId === pendingStationAction.path}
          onCancel={() => setPendingStationAction(null)}
          onConfirm={confirmPendingStationAction}
        />
      ) : null}
    </main>
  );
}

function StationStatusConfirmDialog({
  action,
  isBusy,
  onCancel,
  onConfirm
}: {
  action: StationStatusAction;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      aria-labelledby="station-status-confirm-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-xl">
        <p className="text-sm font-bold text-[var(--primary)]">
          {action.nextStatus === "ACTIVE" ? "Kích hoạt dữ liệu" : "Ẩn dữ liệu"}
        </p>
        <h2 id="station-status-confirm-title" className="mt-1 text-2xl font-black">
          {action.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{action.description}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="a97-button secondary" type="button" disabled={isBusy} onClick={onCancel}>
            Hủy
          </button>
          <button className="a97-button" type="button" disabled={isBusy} onClick={onConfirm}>
            {isBusy ? "Đang xử lý..." : action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModerationItem({
  submission,
  busyId,
  isExpanded,
  onToggle,
  onApprove,
  onReject
}: {
  submission: AdminSubmission;
  busyId: string | null;
  isExpanded: boolean;
  onToggle: () => void;
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

  const isBusy = busyId !== null;
  const coordinates = `${submission.latitude.toFixed(6)}, ${submission.longitude.toFixed(6)}`;
  const directionsUrl = `${DIRECTIONS_BASE_URL}&destination=${submission.latitude},${submission.longitude}`;

  function update(key: keyof typeof draft, value: string | number) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <article className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
      <button
        aria-controls={`submission-${submission.id}`}
        aria-expanded={isExpanded}
        className="flex w-full flex-col gap-3 p-4 text-left transition hover:bg-[#f4fbf8] md:flex-row md:items-center md:justify-between"
        type="button"
        onClick={onToggle}
      >
        <span className="grid min-w-0 gap-1">
          <span className="text-sm font-bold text-[var(--primary)]">
            Gửi lúc {new Intl.DateTimeFormat("vi-VN").format(new Date(submission.createdAt))}
          </span>
          <span className="truncate text-lg font-black">{submission.name}</span>
          <span className="text-sm text-[var(--muted)]">
            {submission.province} · {submission.address}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3 text-sm font-bold text-[var(--muted)]">
          <span>Tọa độ: {coordinates}</span>
          {isExpanded ? (
            <ChevronDown size={20} aria-hidden />
          ) : (
            <ChevronRight size={20} aria-hidden />
          )}
        </span>
      </button>

      {isExpanded ? (
        <div id={`submission-${submission.id}`} className="border-t border-[var(--line)] p-4">
          {(submission.submitterName || submission.submitterContact) ? (
            <p className="mb-4 text-sm text-[var(--muted)]">
              Người gửi: {submission.submitterName ?? "Không rõ"} /{" "}
              {submission.submitterContact ?? "Không để lại liên hệ"}
            </p>
          ) : null}
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
            {submission.photoUrl || submission.sourceUrl ? (
              <div className="a97-label md:col-span-2">
                <span className="block text-sm font-bold text-[var(--foreground)]">
                  Tài liệu
                </span>
                <div className="mt-1 flex flex-wrap gap-2 text-sm">
                  {submission.photoUrl ? (
                    <a
                      className="font-bold text-[var(--primary)] underline"
                      href={submission.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ảnh minh chứng
                    </a>
                  ) : null}
                  {submission.sourceUrl ? (
                    <a
                      className="font-bold text-[var(--primary)] underline"
                      href={submission.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Nguồn
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
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
            <a
              className="a97-button secondary"
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Kiểm tra trên bản đồ
            </a>
            <button
              className="a97-button"
              type="button"
              disabled={isBusy}
              onClick={() => onApprove(draft)}
            >
              <Check size={18} aria-hidden />
              {isBusy ? "Đang xử lý..." : "Duyệt"}
            </button>
            <button
              className="a97-button secondary"
              type="button"
              disabled={isBusy}
              onClick={() => onReject(draft.moderationNotes)}
            >
              <X size={18} aria-hidden />
              {isBusy ? "Đang xử lý..." : "Từ chối"}
            </button>
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Duyệt sẽ tạo mới cây xăng và xóa trạng thái ticket ngay sau khi cache bản đồ được làm mới.
          </p>
        </div>
      ) : null}
    </article>
  );
}

function AdminPagination({
  ariaLabel,
  className,
  pagination,
  hrefForPage,
  noun
}: {
  ariaLabel: string;
  className: string;
  pagination: PaginationState;
  hrefForPage: (page: number) => string;
  noun: string;
}) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const previousPage = pagination.page - 1;
  const nextPage = pagination.page + 1;

  return (
    <nav
      aria-label={ariaLabel}
      className={className}
    >
      <p className="font-bold text-[var(--muted)]">
        Trang {pagination.page}/{pagination.totalPages} · {pagination.totalCount} {noun}
      </p>
      <div className="flex flex-wrap gap-2">
        {pagination.page > 1 ? (
          <Link className="a97-button secondary" href={hrefForPage(previousPage)}>
            Trước
          </Link>
        ) : (
          <span className="a97-button secondary cursor-not-allowed opacity-50">Trước</span>
        )}
        {pagination.page < pagination.totalPages ? (
          <Link className="a97-button secondary" href={hrefForPage(nextPage)}>
            Sau
          </Link>
        ) : (
          <span className="a97-button secondary cursor-not-allowed opacity-50">Sau</span>
        )}
      </div>
    </nav>
  );
}

function adminPageHref({ page, stationPage }: { page: number; stationPage: number }) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (stationPage > 1) {
    params.set("stationPage", String(stationPage));
  }

  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}
