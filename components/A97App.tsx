"use client";

import dynamic from "next/dynamic";
import { Crosshair, ListFilter, Loader2, MapPinned, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MAP_ISSUE_URL } from "@/lib/constants";
import type { Coordinates } from "@/lib/distance";
import { filterStations } from "@/lib/station-search";
import type { PublicStation } from "@/lib/stations";
import { SubmitStationForm } from "@/components/SubmitStationForm";

const StationMap = dynamic(() => import("@/components/StationMap").then((mod) => mod.StationMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[420px] place-items-center bg-[#e8efe8] text-sm font-bold text-[var(--muted)]">
      Đang tải bản đồ...
    </div>
  )
});

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function A97App() {
  const [stations, setStations] = useState<PublicStation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [mode, setMode] = useState<"map" | "submit">("map");
  const [query, setQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/stations")
      .then((response) => response.json() as Promise<ApiResponse<PublicStation[]>>)
      .then((payload) => {
        if (!active) {
          return;
        }
        if (!payload.success || !payload.data) {
          throw new Error(payload.error ?? "Không thể tải dữ liệu");
        }
        setStations(payload.data);
      })
      .catch((fetchError: Error) => {
        if (active) {
          setError(fetchError.message);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const orderedStations = useMemo(() => {
    return filterStations(stations, { query, origin, radiusKm });
  }, [origin, query, radiusKm, stations]);

  const selectedStation = orderedStations.find((station) => station.id === selectedId) ?? null;

  function locateUser() {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setError(null);
      },
      () => {
        setError("Không thể lấy vị trí hiện tại. Hãy kiểm tra quyền định vị.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="min-h-[560px] overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-sm">
        {mode === "map" ? (
          <StationMap
            stations={orderedStations}
            selectedStation={selectedStation}
            userLocation={origin}
            onSelectStation={setSelectedId}
          />
        ) : (
          <SubmitStationForm onSubmitted={() => setMode("map")} />
        )}
      </div>

      <aside className="grid content-start gap-4">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`a97-button ${mode === "map" ? "" : "secondary"}`}
              type="button"
              onClick={() => setMode("map")}
            >
              <MapPinned size={18} aria-hidden />
              Bản đồ
            </button>
            <button
              className={`a97-button ${mode === "submit" ? "" : "secondary"}`}
              type="button"
              onClick={() => setMode("submit")}
            >
              <Plus size={18} aria-hidden />
              Gửi vị trí
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--primary)]">
                Bản đồ Việt Nam, bao gồm Hoàng Sa và Trường Sa
              </p>
              <h2 className="text-xl font-black">{stations.length} cây xăng A97</h2>
            </div>
            <button className="a97-button secondary" type="button" onClick={locateUser}>
              <Crosshair size={18} aria-hidden />
              Gần tôi
            </button>
          </div>
          {origin ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Danh sách đang lọc trong bán kính {radiusKm} km từ vị trí của bạn.
            </p>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Bật định vị để xem cây xăng gần nhất. Ứng dụng không gửi vị trí của bạn lên máy chủ.
            </p>
          )}
          <a
            className="mt-3 inline-block text-sm font-bold text-[var(--primary)]"
            href={MAP_ISSUE_URL}
            target="_blank"
            rel="noreferrer"
          >
            Báo lỗi bản đồ
          </a>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
          <label className="a97-label">
            <span className="flex items-center gap-2">
              <Search size={17} aria-hidden />
              Tìm theo tên, địa chỉ, tỉnh/thành
            </span>
            <input
              className="a97-input"
              placeholder="Ví dụ: Hà Nội, Petrolimex, QL1A"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="a97-label mt-4">
            Bán kính khi bật định vị
            <select
              className="a97-input"
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              disabled={!origin}
            >
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
              <option value={250}>250 km</option>
            </select>
          </label>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)]">
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
            <ListFilter size={18} aria-hidden />
            <h2 className="font-black">Danh sách cây xăng</h2>
          </div>
          <div className="max-h-[520px] overflow-auto">
            {isLoading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-[var(--muted)]">
                <Loader2 className="animate-spin" size={18} aria-hidden />
                Đang tải dữ liệu...
              </div>
            ) : orderedStations.length === 0 ? (
              <p className="p-4 text-sm text-[var(--muted)]">
                Không tìm thấy cây xăng phù hợp. Hãy đổi bộ lọc hoặc gửi vị trí mới.
              </p>
            ) : (
              orderedStations.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(station.id);
                    setMode("map");
                  }}
                  className="block w-full border-b border-[var(--line)] px-4 py-3 text-left last:border-0 hover:bg-white"
                >
                  <span className="block font-black">{station.name}</span>
                  <span className="mt-1 block text-sm text-[var(--muted)]">{station.address}</span>
                  {"distanceKm" in station && typeof station.distanceKm === "number" ? (
                    <span className="mt-2 block text-sm font-bold text-[var(--primary)]">
                      Cách khoảng {station.distanceKm.toFixed(1)} km
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      </aside>
    </section>
  );
}
