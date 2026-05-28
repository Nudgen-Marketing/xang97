"use client";

import { useEffect, useRef, useState } from "react";
import {
  GOOGLE_MAPS_MAP_ID,
  VIETNAM_ARCHIPELAGOS,
  VIETNAM_CENTER
} from "@/lib/constants";
import type { Coordinates } from "@/lib/distance";
import {
  googleVietnamBounds,
  hasGoogleMapsApiKey,
  loadGoogleMapLibraries,
  shouldUseAdvancedMarkers
} from "@/lib/google-maps";
import type { PublicStation } from "@/lib/stations";

type StationMapProps = {
  stations: PublicStation[];
  selectedStation: PublicStation | null;
  userLocation: Coordinates | null;
  onSelectStation: (id: string) => void;
};

type GoogleMapLibraries = Awaited<ReturnType<typeof loadGoogleMapLibraries>>;

type MapMarker = google.maps.marker.AdvancedMarkerElement | google.maps.Marker;

type PinOptions = {
  background: string;
  borderColor: string;
  glyph?: string;
  scale?: number;
};

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

function toLatLng(point: Coordinates): google.maps.LatLngLiteral {
  return {
    lat: point.latitude,
    lng: point.longitude
  };
}

function createPin(
  markerLibrary: google.maps.MarkerLibrary,
  options: PinOptions
) {
  return new markerLibrary.PinElement({
    background: options.background,
    borderColor: options.borderColor,
    glyphColor: "white",
    glyph: options.glyph,
    scale: options.scale ?? 1
  }).element;
}

function createLegacyIcon(options: PinOptions): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: options.background,
    fillOpacity: 1,
    scale: 10 * (options.scale ?? 1),
    strokeColor: options.borderColor,
    strokeWeight: 2
  };
}

function createLegacyLabel(text: string, color = "white"): google.maps.MarkerLabel {
  return {
    text,
    color,
    fontSize: "13px",
    fontWeight: "800"
  };
}

function clearMarker(marker: MapMarker) {
  if ("setMap" in marker) {
    marker.setMap(null);
    return;
  }

  marker.map = null;
}

function setMarkerPosition(marker: MapMarker, position: google.maps.LatLngLiteral) {
  if ("setPosition" in marker) {
    marker.setPosition(position);
    return;
  }

  marker.position = position;
}

function createPinMarker(
  libraries: GoogleMapLibraries,
  map: google.maps.Map,
  options: {
    position: google.maps.LatLngLiteral;
    title: string;
    pin: PinOptions;
  }
): MapMarker {
  if (shouldUseAdvancedMarkers()) {
    return new libraries.markerLibrary.AdvancedMarkerElement({
      map,
      position: options.position,
      title: options.title,
      content: createPin(libraries.markerLibrary, options.pin)
    });
  }

  return new google.maps.Marker({
    map,
    position: options.position,
    title: options.title,
    icon: createLegacyIcon(options.pin),
    label: options.pin.glyph ? createLegacyLabel(options.pin.glyph) : undefined,
    optimized: false
  });
}

function createTextMarker(
  libraries: GoogleMapLibraries,
  map: google.maps.Map,
  options: {
    position: google.maps.LatLngLiteral;
    title: string;
    text: string;
  }
): MapMarker {
  if (shouldUseAdvancedMarkers()) {
    return new libraries.markerLibrary.AdvancedMarkerElement({
      map,
      position: options.position,
      content: createArchipelagoLabel(options.text),
      title: options.title
    });
  }

  return new google.maps.Marker({
    map,
    position: options.position,
    title: options.title,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillOpacity: 0,
      scale: 0,
      strokeOpacity: 0
    },
    label: createLegacyLabel(options.text, "#0b3f35"),
    optimized: false
  });
}

function createArchipelagoLabel(name: string) {
  const label = document.createElement("div");
  label.className = "a97-archipelago-label";
  label.textContent = name;
  return label;
}

function createStationInfoContent(station: PublicStation) {
  const wrapper = document.createElement("div");
  wrapper.className = "a97-map-popup";

  const verifiedText = station.lastVerifiedAt
    ? new Intl.DateTimeFormat("vi-VN").format(new Date(station.lastVerifiedAt))
    : "chưa rõ";
  const locality = `${station.ward ? `${station.ward}, ` : ""}${
    station.district ? `${station.district}, ` : ""
  }${station.province}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}&travelmode=driving`;

  const name = document.createElement("strong");
  name.textContent = station.name;
  wrapper.append(name);

  const address = document.createElement("p");
  address.textContent = station.address;
  wrapper.append(address);

  const localityElement = document.createElement("p");
  localityElement.className = "a97-map-popup-muted";
  localityElement.textContent = locality;
  wrapper.append(localityElement);

  if (station.brand) {
    const brand = document.createElement("p");
    brand.className = "a97-map-popup-muted";
    brand.textContent = `Thương hiệu: ${station.brand}`;
    wrapper.append(brand);
  }

  if (station.notes) {
    const notes = document.createElement("p");
    notes.className = "a97-map-popup-muted";
    notes.textContent = `Ghi chú: ${station.notes}`;
    wrapper.append(notes);
  }

  const verified = document.createElement("p");
  verified.className = "a97-map-popup-small";
  verified.textContent = `Xác minh: ${verifiedText}`;
  wrapper.append(verified);

  const directions = document.createElement("a");
  directions.target = "_blank";
  directions.rel = "noreferrer";
  directions.href = directionsUrl;
  directions.textContent = "Mở chỉ đường";
  wrapper.append(directions);
  wrapper.append(document.createElement("br"));

  const report = document.createElement("a");
  report.href = `mailto:admin@example.com?subject=Báo lỗi cây xăng A97 ${encodeURIComponent(
    station.name
  )}`;
  report.textContent = "Báo sai thông tin";
  wrapper.append(report);

  return wrapper;
}

function createMap(
  element: HTMLElement,
  mapsLibrary: google.maps.MapsLibrary,
  options: google.maps.MapOptions
) {
  return new mapsLibrary.Map(element, {
    mapId: GOOGLE_MAPS_MAP_ID || undefined,
    center: toLatLng(VIETNAM_CENTER),
    zoom: 5,
    minZoom: 5,
    restriction: {
      latLngBounds: googleVietnamBounds,
      strictBounds: false
    },
    clickableIcons: false,
    fullscreenControl: true,
    gestureHandling: "greedy",
    mapTypeControl: false,
    streetViewControl: false,
    ...options
  });
}

function GoogleMapFallback({ minHeightClass }: { minHeightClass: string }) {
  return (
    <div
      className={`grid ${minHeightClass} place-items-center bg-[#e8efe8] p-6 text-center text-sm text-[var(--muted)]`}
      data-testid="google-map-shell"
    >
      <div>
        <p className="font-black text-[var(--foreground)]">Chưa cấu hình Google Maps API</p>
        <p className="mt-2 max-w-md">
          Thêm `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` đã giới hạn domain và bật Maps JavaScript API,
          Places API để hiển thị bản đồ.
        </p>
        <p className="mt-3 text-xs font-bold">
          Quần đảo Hoàng Sa · Quần đảo Trường Sa
        </p>
      </div>
    </div>
  );
}

function GoogleMapLoadError({ message, minHeightClass }: { message: string; minHeightClass: string }) {
  return (
    <div
      className={`grid ${minHeightClass} place-items-center bg-red-50 p-6 text-center text-sm font-bold text-red-700`}
      data-testid="google-map-shell"
    >
      {message}
    </div>
  );
}

export function StationMap({
  stations,
  selectedStation,
  userLocation,
  onSelectStation
}: StationMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const librariesRef = useRef<GoogleMapLibraries | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const stationMarkersRef = useRef<MapMarker[]>([]);
  const userMarkerRef = useRef<MapMarker | null>(null);
  const labelMarkersRef = useRef<MapMarker[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!hasGoogleMapsApiKey() || !mapElementRef.current) {
      return;
    }

    let cancelled = false;
    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      if (!cancelled) {
        setLoadError(
          "Google Maps API key chưa được chấp nhận. Hãy bật Maps JavaScript API, billing và cho phép referrer localhost/domain production."
        );
      }
      previousAuthFailure?.();
    };

    async function initMap() {
      try {
        const libraries = await loadGoogleMapLibraries();
        if (cancelled || !mapElementRef.current) {
          return;
        }

        librariesRef.current = libraries;
        const map = createMap(mapElementRef.current, libraries.mapsLibrary, {});
        mapRef.current = map;
        infoWindowRef.current = new libraries.mapsLibrary.InfoWindow();
        labelMarkersRef.current = VIETNAM_ARCHIPELAGOS.map(
          (archipelago) =>
            createTextMarker(libraries, map, {
              position: { lat: archipelago.latitude, lng: archipelago.longitude },
              text: archipelago.name,
              title: archipelago.name
            })
        );
        setIsReady(true);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Không thể tải Google Maps.");
        }
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      window.gm_authFailure = previousAuthFailure;
      stationMarkersRef.current.forEach((marker) => {
        clearMarker(marker);
      });
      labelMarkersRef.current.forEach((marker) => {
        clearMarker(marker);
      });
      if (userMarkerRef.current) {
        clearMarker(userMarkerRef.current);
      }
      stationMarkersRef.current = [];
      labelMarkersRef.current = [];
      userMarkerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const libraries = librariesRef.current;
    if (!map || !libraries || !isReady) {
      return;
    }

    stationMarkersRef.current.forEach((marker) => {
      clearMarker(marker);
    });

    stationMarkersRef.current = stations.map((station) => {
      const isSelected = selectedStation?.id === station.id;
      const marker = createPinMarker(libraries, map, {
        position: { lat: station.latitude, lng: station.longitude },
        title: station.name,
        pin: {
          background: isSelected ? "#d8432e" : "#0b6b57",
          borderColor: isSelected ? "#a72e1f" : "#084f42",
          glyph: "A",
          scale: isSelected ? 1.15 : 1
        }
      });

      marker.addListener("click", () => {
        onSelectStation(station.id);
        infoWindowRef.current?.setContent(createStationInfoContent(station));
        infoWindowRef.current?.open({ map, anchor: marker });
      });

      return marker;
    });
  }, [isReady, onSelectStation, selectedStation?.id, stations]);

  useEffect(() => {
    const map = mapRef.current;
    const libraries = librariesRef.current;
    if (!map || !libraries || !isReady) {
      return;
    }

    if (userMarkerRef.current) {
      clearMarker(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      userMarkerRef.current = createPinMarker(libraries, map, {
        position: toLatLng(userLocation),
        title: "Vị trí hiện tại của bạn",
        pin: {
          background: "#2563eb",
          borderColor: "#1d4ed8",
          glyph: "•",
          scale: 0.95
        }
      });
    }
  }, [isReady, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) {
      return;
    }

    const point = selectedStation ?? userLocation;
    if (point) {
      map.panTo(toLatLng(point));
      map.setZoom(14);
    }
  }, [isReady, selectedStation, userLocation]);

  if (!hasGoogleMapsApiKey()) {
    return <GoogleMapFallback minHeightClass="min-h-[560px] lg:min-h-[720px]" />;
  }

  if (loadError) {
    return <GoogleMapLoadError message={loadError} minHeightClass="min-h-[560px] lg:min-h-[720px]" />;
  }

  return (
    <div
      ref={mapElementRef}
      className="a97-google-map h-[560px] lg:h-[720px]"
      data-testid="google-map-shell"
    />
  );
}

type PickerMapProps = {
  value: Coordinates;
  onChange: (coordinates: Coordinates) => void;
};

export function PickerMap({ value, onChange }: PickerMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const librariesRef = useRef<GoogleMapLibraries | null>(null);
  const markerRef = useRef<MapMarker | null>(null);
  const labelMarkersRef = useRef<MapMarker[]>([]);
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const initialValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hasGoogleMapsApiKey() || !mapElementRef.current) {
      return;
    }

    let cancelled = false;
    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      if (!cancelled) {
        setLoadError(
          "Google Maps API key chưa được chấp nhận. Hãy bật Maps JavaScript API, billing và cho phép referrer localhost/domain production."
        );
      }
      previousAuthFailure?.();
    };

    async function initMap() {
      try {
        const libraries = await loadGoogleMapLibraries();
        if (cancelled || !mapElementRef.current) {
          return;
        }

        librariesRef.current = libraries;
        const map = createMap(mapElementRef.current, libraries.mapsLibrary, {
          center: toLatLng(initialValueRef.current),
          zoom: 13
        });
        mapRef.current = map;
        labelMarkersRef.current = VIETNAM_ARCHIPELAGOS.map(
          (archipelago) =>
            createTextMarker(libraries, map, {
              position: { lat: archipelago.latitude, lng: archipelago.longitude },
              text: archipelago.name,
              title: archipelago.name
            })
        );
        listenerRef.current = map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) {
            return;
          }
          onChangeRef.current({
            latitude: Number(event.latLng.lat().toFixed(6)),
            longitude: Number(event.latLng.lng().toFixed(6))
          });
        });
        setIsReady(true);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Không thể tải Google Maps.");
        }
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      window.gm_authFailure = previousAuthFailure;
      listenerRef.current?.remove();
      labelMarkersRef.current.forEach((marker) => {
        clearMarker(marker);
      });
      if (markerRef.current) {
        clearMarker(markerRef.current);
      }
      labelMarkersRef.current = [];
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const libraries = librariesRef.current;
    if (!map || !libraries || !isReady) {
      return;
    }

    const position = toLatLng(value);
    if (!markerRef.current) {
      markerRef.current = createPinMarker(libraries, map, {
        position,
        title: "Vị trí bạn chọn",
        pin: {
          background: "#d8432e",
          borderColor: "#a72e1f",
          glyph: "✓",
          scale: 1.1
        }
      });
    } else {
      setMarkerPosition(markerRef.current, position);
    }
    map.panTo(position);
  }, [isReady, value]);

  if (!hasGoogleMapsApiKey()) {
    return <GoogleMapFallback minHeightClass="h-[320px]" />;
  }

  if (loadError) {
    return <GoogleMapLoadError message={loadError} minHeightClass="h-[320px]" />;
  }

  return <div ref={mapElementRef} className="a97-google-map h-[320px]" data-testid="google-map-shell" />;
}
