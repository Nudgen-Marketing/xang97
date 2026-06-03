"use client";

import { useEffect, useRef, useState } from "react";
import {
  VIETNAM_CENTER
} from "@/lib/constants";
import type { Coordinates } from "@/lib/distance";
import {
  getGoogleMapsMapId,
  googleVietnamBounds,
  hasGoogleMapsApiKey,
  loadGoogleMapLibraries,
  shouldUseAdvancedMarkers
} from "@/lib/google-maps";
import {
  getRadiusCameraPadding,
  shouldFitRadiusForCamera
} from "@/lib/map-camera";
import type { PublicStation } from "@/lib/stations";

type StationMapProps = {
  stations: PublicStation[];
  selectedStation: PublicStation | null;
  userLocation: Coordinates | null;
  userLocationKind: "place" | "geolocation" | null;
  userLocationLabel: string | null;
  userLocationSelectionKey: number;
  radiusKm: number;
  onSelectStation: (id: string) => void;
};

type GoogleMapLibraries = Awaited<ReturnType<typeof loadGoogleMapLibraries>>;

type MapMarker = google.maps.marker.AdvancedMarkerElement | google.maps.Marker;

type PinGlyph = google.maps.marker.PinElementOptions["glyph"];

type PinOptions = {
  background: string;
  borderColor: string;
  accentColor?: string;
  glyph?: PinGlyph;
  markerStyle?: "station" | "location";
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

function createFuelGlyphElement({ size = 18 }: { size?: number } = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.dataset.markerGlyph = "fuel";
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "white");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", "3");
  line1.setAttribute("y1", "22");
  line1.setAttribute("x2", "15");
  line1.setAttribute("y2", "22");
  svg.append(line1);

  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", "4");
  line2.setAttribute("y1", "9");
  line2.setAttribute("x2", "14");
  line2.setAttribute("y2", "9");
  svg.append(line2);

  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", "M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18");
  svg.append(path1);

  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute(
    "d",
    "M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"
  );
  svg.append(path2);

  return svg;
}

function createLocationPinGlyphElement({ size = 18 }: { size?: number } = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.dataset.lucideGlyph = "map-pin";
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "white");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
  );
  svg.append(path);

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "10");
  circle.setAttribute("r", "3");
  svg.append(circle);

  return svg;
}

function createCustomPinElement(options: PinOptions) {
  const marker = document.createElement("div");
  marker.className = `a97-map-marker a97-map-marker-${options.markerStyle ?? "station"}`;
  marker.style.setProperty("--marker-bg", options.background);
  marker.style.setProperty("--marker-border", options.borderColor);
  marker.style.setProperty("--marker-accent", options.accentColor ?? options.borderColor);
  marker.style.setProperty("--marker-scale", String(options.scale ?? 1));

  const badge = document.createElement("span");
  badge.className = "a97-map-marker-badge";

  if (options.glyph instanceof Node) {
    badge.append(options.glyph);
  } else if (typeof options.glyph === "string") {
    badge.textContent = options.glyph;
  }

  marker.append(badge);
  return marker;
}

function createLegacyMapPinSvgIcon(options: PinOptions): google.maps.Icon {
  const scale = options.scale ?? 1;
  const size = Math.round(54 * scale);

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 54 62">`,
    `<defs><filter id="shadow" x="-25%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000000" flood-opacity=".24"/></filter></defs>`,
    `<path filter="url(#shadow)" d="M27 59c-5.8-7.4-17-20.1-17-32.2C10 16.3 17.6 8 27 8s17 8.3 17 18.8C44 38.9 32.8 51.6 27 59Z" fill="${options.background}" stroke="white" stroke-width="4" />`,
    `<path d="M27 59c-5.8-7.4-17-20.1-17-32.2C10 16.3 17.6 8 27 8s17 8.3 17 18.8C44 38.9 32.8 51.6 27 59Z" fill="${options.background}" stroke="${options.borderColor}" stroke-width="2" />`,
    `<circle cx="27" cy="26" r="9" fill="white" fill-opacity=".16" />`,
    `<g transform="translate(18 17)" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">`,
    `<path d="M9 17s7-6.6 7-11A7 7 0 0 0 2 6c0 4.4 7 11 7 11Z" />`,
    `<circle cx="9" cy="6" r="2.4" />`,
    `</g>`,
    `</svg>`
  ].join("");

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, (size * 58) / 62)
  };
}

function createPin(
  markerLibrary: google.maps.MarkerLibrary,
  options: PinOptions
) {
  if (options.markerStyle) {
    return createCustomPinElement(options);
  }

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

function createLegacySvgIcon(options: PinOptions): google.maps.Icon {
  const scale = options.scale ?? 1;
  const size = Math.round(52 * scale);
  const accentColor = options.accentColor ?? options.borderColor;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 52 58">`,
    `<defs><filter id="shadow" x="-25%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000000" flood-opacity=".22"/></filter></defs>`,
    `<path filter="url(#shadow)" d="M26 55 15 42h22L26 55Z" fill="${accentColor}" />`,
    `<circle cx="26" cy="24" r="20" fill="white" stroke="white" stroke-width="4" />`,
    `<circle cx="26" cy="24" r="17" fill="${options.background}" stroke="${options.borderColor}" stroke-width="3" />`,
    `<path d="M17 41h18l-9 10Z" fill="${accentColor}" stroke="white" stroke-width="2" stroke-linejoin="round" />`,
    `<g transform="translate(14 12)" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">`,
    `<line x1="3" y1="22" x2="15" y2="22" />`,
    `<line x1="4" y1="9" x2="14" y2="9" />`,
    `<path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />`,
    `<path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />`,
    `</g>`,
    `</svg>`
  ].join("");

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, (size * 54) / 58)
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

  if (options.pin.glyph && typeof options.pin.glyph !== "string") {
    if (
      options.pin.glyph instanceof HTMLElement &&
      options.pin.glyph.dataset.lucideGlyph === "map-pin"
    ) {
      return new google.maps.Marker({
        map,
        position: options.position,
        title: options.title,
        icon: createLegacyMapPinSvgIcon(options.pin),
        optimized: false
      });
    }

    return new google.maps.Marker({
      map,
      position: options.position,
      title: options.title,
      icon: createLegacySvgIcon(options.pin),
      optimized: false
    });
  }

  return new google.maps.Marker({
    map,
    position: options.position,
    title: options.title,
    icon: createLegacyIcon(options.pin),
    label: typeof options.pin.glyph === "string" ? createLegacyLabel(options.pin.glyph) : undefined,
    optimized: false
  });
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
    mapId: getGoogleMapsMapId(),
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
  userLocationKind,
  userLocationLabel,
  userLocationSelectionKey,
  radiusKm,
  onSelectStation
}: StationMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const librariesRef = useRef<GoogleMapLibraries | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const stationMarkersRef = useRef<MapMarker[]>([]);
  const stationMarkerByIdRef = useRef<Map<string, MapMarker>>(new Map());
  const userMarkerRef = useRef<MapMarker | null>(null);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!hasGoogleMapsApiKey() || !mapElementRef.current) {
      return;
    }

    let cancelled = false;
    const stationMarkerById = stationMarkerByIdRef.current;
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

      if (userMarkerRef.current) {
        clearMarker(userMarkerRef.current);
      }
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setMap(null);
      }
      stationMarkersRef.current = [];
      stationMarkerById.clear();

      userMarkerRef.current = null;
      radiusCircleRef.current = null;
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

    stationMarkerByIdRef.current.clear();
    stationMarkersRef.current = stations.map((station) => {
      const isSelected = selectedStation?.id === station.id;
      const marker = createPinMarker(libraries, map, {
        position: { lat: station.latitude, lng: station.longitude },
        title: station.name,
        pin: {
          background: isSelected ? "#d8432e" : "#0b6b57",
          borderColor: isSelected ? "#a72e1f" : "#084f42",
          accentColor: isSelected ? "#f4b23b" : "#d8432e",
          glyph: createFuelGlyphElement(),
          markerStyle: "station",
          scale: isSelected ? 1.18 : 1
        }
      });

      stationMarkerByIdRef.current.set(station.id, marker);
      marker.addListener("click", () => {
        map.panTo({ lat: station.latitude, lng: station.longitude });
        map.setZoom(15);
        onSelectStation(station.id);
        infoWindowRef.current?.setContent(createStationInfoContent(station));
        infoWindowRef.current?.open({ map, anchor: marker });
      });

      return marker;
    });
  }, [isReady, onSelectStation, selectedStation?.id, stations]);

  useEffect(() => {
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !isReady || !infoWindow) {
      return;
    }

    if (!selectedStation) {
      infoWindow.close();
      return;
    }

    const marker = stationMarkerByIdRef.current.get(selectedStation.id);
    if (!marker) {
      return;
    }

    infoWindow.setContent(createStationInfoContent(selectedStation));
    infoWindow.open({ map, anchor: marker });
  }, [isReady, selectedStation]);

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
      const title = userLocationLabel ?? "Điểm tìm kiếm";
      const pin: PinOptions = {
        background: "#d8432e",
        borderColor: "#a72e1f",
        accentColor: userLocationKind === "geolocation" ? "#f4b23b" : "#ffffff",
        glyph: createLocationPinGlyphElement({
          size: userLocationKind === "geolocation" ? 14 : 16
        }),
        markerStyle: "location",
        scale: userLocationKind === "geolocation" ? 0.98 : 1.04
      };
      userMarkerRef.current = createPinMarker(libraries, map, {
        position: toLatLng(userLocation),
        title,
        pin
      });
    }
  }, [isReady, userLocation, userLocationKind, userLocationLabel]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) {
      return;
    }

    if (!userLocation) {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setMap(null);
        radiusCircleRef.current = null;
      }
      return;
    }

    const center = toLatLng(userLocation);
    const radiusMeters = radiusKm * 1000;

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = new google.maps.Circle({
        map,
        center,
        radius: radiusMeters,
        strokeColor: "#d8432e",
        strokeOpacity: 0.9,
        strokeWeight: 3,
        fillColor: "#d8432e",
        fillOpacity: 0.18,
        zIndex: 2,
        clickable: false
      });
    } else {
      radiusCircleRef.current.setMap(map);
      radiusCircleRef.current.setCenter(center);
      radiusCircleRef.current.setRadius(radiusMeters);
    }

    const bounds = radiusCircleRef.current.getBounds();
    if (
      shouldFitRadiusForCamera({
        hasUserLocation: Boolean(userLocation),
        hasRadiusBounds: Boolean(bounds)
      }) &&
      bounds
    ) {
      const mapElement = map.getDiv();
      const padding = getRadiusCameraPadding({
        width: mapElement.clientWidth,
        height: mapElement.clientHeight
      });
      map.fitBounds(bounds, padding);
    }
  }, [isReady, radiusKm, userLocation, userLocationSelectionKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) {
      return;
    }

    if (selectedStation) {
      map.panTo(toLatLng(selectedStation));
      map.setZoom(15);
      return;
    }

  }, [isReady, selectedStation]);

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

      if (markerRef.current) {
        clearMarker(markerRef.current);
      }

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
          accentColor: "#ffffff",
          glyph: createLocationPinGlyphElement(),
          markerStyle: "location",
          scale: 1.16
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
