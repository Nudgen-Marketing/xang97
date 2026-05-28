"use client";

import dynamic from "next/dynamic";
import { CheckCircle2, Crosshair, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { VIETNAM_CENTER } from "@/lib/constants";
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

const initialState: FormState = {
  name: "",
  brand: "",
  address: "",
  ward: "",
  district: "",
  province: "",
  latitude: VIETNAM_CENTER.latitude,
  longitude: VIETNAM_CENTER.longitude,
  notes: "",
  submitterName: "",
  submitterContact: "",
  photoUrl: "",
  sourceUrl: ""
};

export function SubmitStationForm({ onSubmitted }: SubmitStationFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
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
  }

  function locateUser() {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        updateField("latitude", position.coords.latitude);
        updateField("longitude", position.coords.longitude);
      },
      () => setError("Không thể lấy vị trí hiện tại.")
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = (await response.json()) as { success: boolean; error?: string };

    setIsSubmitting(false);
    if (!payload.success) {
      setError(payload.error ?? "Không thể gửi vị trí.");
      return;
    }

    setForm(initialState);
    setMessage("Đã gửi vị trí. Quản trị viên sẽ kiểm tra trước khi hiển thị công khai.");
    window.setTimeout(onSubmitted, 1200);
  }

  return (
    <div className="grid gap-5 p-4 md:p-5">
      <div>
        <p className="text-sm font-bold text-[var(--primary)]">Đóng góp dữ liệu</p>
        <h2 className="text-2xl font-black">Gửi cây xăng bán A97</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Chọn đúng vị trí trên bản đồ. Thông tin sẽ vào hàng chờ duyệt trước khi xuất hiện cho
          mọi người.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--line)]">
        <PickerMap
          value={{ latitude: form.latitude, longitude: form.longitude }}
          onChange={(coordinates) => {
            updateField("latitude", Number(coordinates.latitude.toFixed(6)));
            updateField("longitude", Number(coordinates.longitude.toFixed(6)));
          }}
        />
      </div>

      <button className="a97-button secondary w-fit" type="button" onClick={locateUser}>
        <Crosshair size={18} aria-hidden />
        Dùng vị trí hiện tại
      </button>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <div className="md:col-span-2">
          <GooglePlaceAutocomplete onSelect={applyGooglePlace} />
        </div>
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
            required
            type="number"
            step="0.000001"
            value={form.latitude}
            onChange={(event) => updateField("latitude", Number(event.target.value))}
          />
        </label>
        <label className="a97-label">
          Kinh độ
          <input
            className="a97-input"
            required
            type="number"
            step="0.000001"
            value={form.longitude}
            onChange={(event) => updateField("longitude", Number(event.target.value))}
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
