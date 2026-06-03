"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, CheckCircle2, Crosshair, Loader2, Send } from "lucide-react";
import { useMemo, useState } from "react";
import {
  GooglePlaceAutocomplete,
  type GooglePlaceSelection
} from "@/components/GooglePlaceAutocomplete";

const PickerMap = dynamic(() => import("@/components/StationMap").then((mod) => mod.PickerMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-[320px] place-items-center bg-[#e8efe8] text-sm font-bold text-[var(--muted)]">
      Đang tải bản đồ chọn vị trí...
    </div>
  )
});

type SubmitStationFormProps = {
  onSubmitted: () => void;
};

type FormState = {
  name: string;
  brand: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  latitude: number;
  longitude: number;
  notes: string;
  submitterName: string;
  submitterContact: string;
  photoUrl: string;
  sourceUrl: string;
};

type SubmissionResponse = {
  success: boolean;
  data?: {
    id?: string;
    status?: string;
  };
  error?: string;
};

const DEFAULT_SUBMISSION_LOCATION = {
  latitude: 10.7769,
  longitude: 106.7009
};

const initialState: FormState = {
  name: "",
  brand: "",
  address: "",
  ward: "",
  district: "",
  province: "",
  latitude: DEFAULT_SUBMISSION_LOCATION.latitude,
  longitude: DEFAULT_SUBMISSION_LOCATION.longitude,
  notes: "",
  submitterName: "",
  submitterContact: "",
  photoUrl: "",
  sourceUrl: ""
};

export function SubmitStationForm({ onSubmitted }: SubmitStationFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [step, setStep] = useState<"pin" | "details" | "done">("pin");
  const [submissionId, setSubmissionId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyGooglePlace(place: GooglePlaceSelection) {
    setForm((current) => ({
      ...current,
      name: current.name || place.name,
      address: place.address || current.address,
      ward: place.ward || current.ward,
      district: place.district || current.district,
      province: place.province || current.province,
      latitude: place.latitude,
      longitude: place.longitude
    }));
    setError(null);
  }

  function locateUser() {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField("latitude", position.coords.latitude);
        updateField("longitude", position.coords.longitude);
        setError(null);
      },
      () => setError("Không thể lấy vị trí hiện tại.")
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as SubmissionResponse;

      if (!payload.success) {
        setError(payload.error ?? "Không thể gửi vị trí.");
        return;
      }

      const nextSubmissionId = payload.data?.id ?? "";
      setSubmissionId(nextSubmissionId);
      setMessage("Hồ sơ đã gửi. Tình trạng: Chờ duyệt.");
      setStep("done");
    } catch {
      setError("Không thể gửi vị trí. Hãy thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasCoordinates = useMemo(
    () => Number.isFinite(form.latitude) && Number.isFinite(form.longitude),
    [form.latitude, form.longitude]
  );

  if (step === "done") {
    return (
      <div className="grid gap-5 p-4 md:p-5">
        <p className="text-sm font-bold text-[var(--primary)]">Hỗ trợ cộng đồng</p>
        <h2 className="text-2xl font-black">Gửi địa điểm thành công</h2>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <p className="font-bold">Mã ticket: {submissionId || "(đang chờ xử lý)"}</p>
          <p className="mt-2">{message}</p>
          <p className="mt-1">Vị trí chỉ xuất hiện công khai sau khi quản trị viên duyệt.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <button
            className="a97-button"
            type="button"
            onClick={() => {
              setForm(initialState);
              setSubmissionId("");
              setMessage(null);
              setError(null);
              setStep("pin");
            }}
          >
            Gửi thêm một địa điểm
          </button>
          <button className="a97-button secondary" type="button" onClick={onSubmitted}>
            Về bản đồ
          </button>
        </div>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="grid gap-5 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--primary)]">Bước 2</p>
            <h2 className="text-2xl font-black">Nhập thông tin cây xăng</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Xác nhận vị trí rồi điền thông tin để gửi ticket vào hàng chờ duyệt.
            </p>
          </div>
          <button
            className="a97-button secondary"
            type="button"
            onClick={() => setStep("pin")}
          >
            <ArrowLeft size={18} aria-hidden />
            Chỉnh vị trí
          </button>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-white p-3 text-sm text-[var(--muted)]">
          <p>
            Vị trí đã chọn: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
          </p>
          <p className="mt-1">
            {form.address || "Chưa có địa chỉ"}
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <label className="a97-label md:col-span-2">
            Tên cây xăng
            <input
              className="a97-input"
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </label>
          <label className="a97-label">
            Thương hiệu
            <input
              className="a97-input"
              value={form.brand}
              onChange={(event) => updateField("brand", event.target.value)}
            />
          </label>
          <label className="a97-label">
            Tỉnh/thành
            <input
              className="a97-input"
              required
              value={form.province}
              onChange={(event) => updateField("province", event.target.value)}
            />
          </label>
          <label className="a97-label md:col-span-2">
            Địa chỉ
            <input
              className="a97-input"
              required
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
            />
          </label>
          <label className="a97-label">
            Phường/xã
            <input
              className="a97-input"
              value={form.ward}
              onChange={(event) => updateField("ward", event.target.value)}
            />
          </label>
          <label className="a97-label">
            Quận/huyện
            <input
              className="a97-input"
              value={form.district}
              onChange={(event) => updateField("district", event.target.value)}
            />
          </label>
          <label className="a97-label">
            Vĩ độ
            <input
              className="a97-input"
              type="number"
              step="0.000001"
              value={form.latitude}
              readOnly
            />
          </label>
          <label className="a97-label">
            Kinh độ
            <input
              className="a97-input"
              type="number"
              step="0.000001"
              value={form.longitude}
              readOnly
            />
          </label>
          <label className="a97-label md:col-span-2">
            Ghi chú
            <textarea
              className="a97-input min-h-[96px]"
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </label>
          <label className="a97-label">
            Tên người gửi
            <input
              className="a97-input"
              value={form.submitterName}
              onChange={(event) => updateField("submitterName", event.target.value)}
            />
          </label>
          <label className="a97-label">
            Liên hệ
            <input
              className="a97-input"
              value={form.submitterContact}
              onChange={(event) => updateField("submitterContact", event.target.value)}
            />
          </label>
          <label className="a97-label">
            Link ảnh
            <input
              className="a97-input"
              type="url"
              value={form.photoUrl}
              onChange={(event) => updateField("photoUrl", event.target.value)}
            />
          </label>
          <label className="a97-label">
            Link nguồn
            <input
              className="a97-input"
              type="url"
              value={form.sourceUrl}
              onChange={(event) => updateField("sourceUrl", event.target.value)}
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 md:col-span-2">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-700 md:col-span-2">
              <CheckCircle2 size={18} aria-hidden />
              {message}
            </p>
          ) : null}

          <button className="a97-button md:col-span-2" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={18} aria-hidden /> : <Send size={18} aria-hidden />}
            Gửi chờ duyệt
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-5 p-4 md:p-5">
      <div>
        <p className="text-sm font-bold text-[var(--primary)]">Bước 1</p>
        <h2 className="text-2xl font-black">Đặt vị trí cây xăng A97</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Chọn chính xác vị trí trên bản đồ. Nhập địa chỉ hoặc bấm “Dùng vị trí hiện tại”.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--line)]">
        <PickerMap
          value={{ latitude: form.latitude, longitude: form.longitude }}
          onChange={(coordinates) => {
            updateField("latitude", Number(coordinates.latitude.toFixed(6)));
            updateField("longitude", Number(coordinates.longitude.toFixed(6)));
            setError(null);
          }}
        />
      </div>

      <button className="a97-button secondary w-fit" type="button" onClick={locateUser}>
        <Crosshair size={18} aria-hidden />
        Dùng vị trí hiện tại
      </button>

      <div>
        <GooglePlaceAutocomplete
          label="Nhập địa chỉ"
          placeholder="Tìm theo địa chỉ, cây xăng hay điểm tham chiếu"
          query={form.address}
          onQueryChange={(address) => updateField("address", address)}
          onSelect={applyGooglePlace}
        />
      </div>

      <p className="text-sm text-[var(--muted)]">
        Tọa độ: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
      </p>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}

      <button
        className="a97-button"
        type="button"
        disabled={!hasCoordinates}
        onClick={() => setStep("details")}
      >
        Tiếp tục điền thông tin
      </button>
    </div>
  );
}
