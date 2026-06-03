"use client";

import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, Crosshair, Loader2, MapPinned, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { Coordinates } from "@/lib/distance";
import type { PaginatedResult } from "@/lib/pagination";
import type { PublicStationWithDistance } from "@/lib/stations";
import { SubmitStationForm } from "@/components/SubmitStationForm";
import {
  GooglePlaceAutocomplete,
  type GooglePlaceSelection
} from "@/components/GooglePlaceAutocomplete";

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

const STATION_PAGE_SIZE = 25;

export function A97App() {
  const [stations, setStations] = useState<PublicStationWithDistance[]>([]);
  const [pagination, setPagination] = useState<Omit<
    PaginatedResult<PublicStationWithDistance>,
    "items"
  > | null>(null);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [originMeta, setOriginMeta] = useState<{
    kind: "place" | "geolocation";
    label: string;
  } | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [userLocationSelectionKey, setUserLocationSelectionKey] = useState(0);
  const [mode, setMode] = useState<"map" | "submit">("map");
  const [radiusKm, setRadiusKm] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(STATION_PAGE_SIZE)
    });

    if (origin) {
      params.set("lat", String(origin.latitude));
      params.set("lng", String(origin.longitude));
      params.set("radiusKm", String(radiusKm));
    }

    fetch(`/api/stations?${params.toString()}`)
      .then(
        (response) => response.json() as Promise<ApiResponse<PaginatedResult<PublicStationWithDistance>>>
      )
      .then((payload) => {
        if (!active) {
          return;
        }
        if (!payload.success || !payload.data) {
          throw new Error(payload.error ?? "Không thể tải dữ liệu");
        }
        const { items, ...nextPagination } = payload.data;
        setStations(items);
        setPagination(nextPagination);
        setSelectedId((currentId) =>
          currentId && items.some((station) => station.id === currentId) ? currentId : null
        );
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
  }, [origin, page, radiusKm]);

  const selectedStation = stations.find((station) => station.id === selectedId) ?? null;
  const totalResults = pagination?.total ?? 0;
  const currentPage = pagination?.page ?? page;
  const totalPages = pagination?.totalPages ?? 1;
  const hasPreviousPage = pagination?.hasPreviousPage ?? false;
  const hasNextPage = pagination?.hasNextPage ?? false;

  function resetStationPage() {
    setIsLoading(true);
    setPage(1);
    setSelectedId(null);
  }

  function goToStationPage(nextPage: number) {
    setIsLoading(true);
    setPage(Math.max(1, nextPage));
  }

  function applyPlace(place: GooglePlaceSelection) {
    setOrigin({
      latitude: place.latitude,
      longitude: place.longitude
    });
    const nextLabel = place.address || place.name;
    setLocationQuery(nextLabel);
    setOriginMeta({
      kind: "place",
      label: nextLabel
    });
    setUserLocationSelectionKey((currentKey) => currentKey + 1);
    resetStationPage();
    setError(null);
  }

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
        setLocationQuery("Vị trí của tôi");
        setOriginMeta({
          kind: "geolocation",
          label: "Vị trí của tôi"
        });
        setUserLocationSelectionKey((currentKey) => currentKey + 1);
        resetStationPage();
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
            stations={stations}
            selectedStation={selectedStation}
            userLocation={origin}
            userLocationKind={originMeta?.kind ?? null}
            userLocationLabel={originMeta?.label ?? null}
            userLocationSelectionKey={userLocationSelectionKey}
            radiusKm={radiusKm}
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

        {mode === "map" ? (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
            <h2 className="text-base font-black">Tìm địa điểm gần bạn</h2>
            <div className="mt-3 space-y-3">
              <GooglePlaceAutocomplete
                label="Nhập địa điểm"
                placeholder="Ví dụ: Nguyễn Trãi, Bình Thạnh"
                query={locationQuery}
                onQueryChange={setLocationQuery}
                onSelect={applyPlace}
              />
              <button className="a97-button secondary w-full" type="button" onClick={locateUser}>
                <Crosshair size={18} aria-hidden />
                Dùng vị trí hiện tại
              </button>
              <label className="a97-label">
                Bán kính tìm gần
                <select
                  className="a97-input"
                  value={radiusKm}
                  onChange={(event) => {
                    setRadiusKm(Number(event.target.value));
                    resetStationPage();
                  }}
                  disabled={!origin}
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
              </label>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)]">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="font-black">Danh sách cây xăng</h2>
              <p className="text-sm text-[var(--muted)]">{totalResults} kết quả</p>
            </div>
          </div>
          <div className="max-h-[520px] overflow-auto">
            {isLoading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-[var(--muted)]">
                <Loader2 className="animate-spin" size={18} aria-hidden />
                Đang tải dữ liệu...
              </div>
            ) : stations.length === 0 ? (
              <p className="p-4 text-sm text-[var(--muted)]">
                Không tìm thấy cây xăng phù hợp. Hãy đổi bộ lọc hoặc gửi vị trí mới.
              </p>
            ) : (
              stations.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(station.id);
                    setMode("map");
                    setError(null);
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
          <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
            <button
              className="a97-button secondary"
              type="button"
              onClick={() => goToStationPage(page - 1)}
              disabled={isLoading || !hasPreviousPage}
            >
              <ChevronLeft size={16} aria-hidden />
              Trước
            </button>
            <p className="text-sm font-bold text-[var(--muted)]">
              Trang {currentPage} / {totalPages}
            </p>
            <button
              className="a97-button secondary"
              type="button"
              onClick={() => goToStationPage(page + 1)}
              disabled={isLoading || !hasNextPage}
            >
              Sau
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      </aside>
    </section>
  );
}
