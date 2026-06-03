"use client";

import { MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GOOGLE_MAPS_LANGUAGE, GOOGLE_MAPS_REGION } from "@/lib/constants";
import {
  googleVietnamBounds,
  hasGoogleMapsApiKey,
  loadGooglePlacesLibrary
} from "@/lib/google-maps";

export type GooglePlaceSelection = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  ward: string;
  district: string;
  province: string;
};

type GooglePlaceAutocompleteProps = {
  onSelect: (place: GooglePlaceSelection) => void;
  label?: string;
  placeholder?: string;
  query?: string;
  onQueryChange?: (value: string) => void;
};

type PlacePrediction = google.maps.places.PlacePrediction;
type PlacesLibrary = google.maps.PlacesLibrary;

function getAddressComponent(
  components: google.maps.places.AddressComponent[] | undefined,
  acceptedTypes: string[]
) {
  return (
    components?.find((component) =>
      acceptedTypes.some((type) => component.types.includes(type))
    )?.longText ?? ""
  );
}

function toSelection(place: google.maps.places.Place): GooglePlaceSelection | null {
  const location = place.location;
  if (!location) {
    return null;
  }

  return {
    name: place.displayName ?? "",
    address: place.formattedAddress ?? "",
    latitude: Number(location.lat().toFixed(6)),
    longitude: Number(location.lng().toFixed(6)),
    ward: getAddressComponent(place.addressComponents, [
      "administrative_area_level_4",
      "sublocality_level_1",
      "ward"
    ]),
    district: getAddressComponent(place.addressComponents, [
      "administrative_area_level_2",
      "locality"
    ]),
    province: getAddressComponent(place.addressComponents, [
      "administrative_area_level_1"
    ])
  };
}

export function GooglePlaceAutocomplete({
  onSelect,
  label = "Tìm địa chỉ bằng Google Maps",
  placeholder = "Nhập ít nhất 3 ký tự, ví dụ: cây xăng A97 Đà Nẵng",
  query,
  onQueryChange
}: GooglePlaceAutocompleteProps) {
  const [uncontrolledQueryText, setUncontrolledQueryText] = useState(query ?? "");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [placesLibrary, setPlacesLibrary] = useState<PlacesLibrary | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [selectedQuery, setSelectedQuery] = useState("");
  const isControlled = query !== undefined;
  const queryText = isControlled ? query : uncontrolledQueryText;
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  function syncQuery(nextQuery: string) {
    if (!isControlled) {
      setUncontrolledQueryText(nextQuery);
    }
    onQueryChange?.(nextQuery);
  }

  async function ensurePlacesLibrary() {
    if (placesLibrary || isLoadingLibrary || !hasGoogleMapsApiKey()) {
      return;
    }

    setIsLoadingLibrary(true);
    setError(null);
    try {
      const loadedLibrary = await loadGooglePlacesLibrary();
      setPlacesLibrary(loadedLibrary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải Google Places.");
    } finally {
      setIsLoadingLibrary(false);
    }
  }

  useEffect(() => {
    if (!placesLibrary || queryText.trim().length < 3) {
      return;
    }

    const searchText = queryText.trim();
    if (searchText === selectedQuery) {
      return;
    }

    const token =
      sessionTokenRef.current ?? new placesLibrary.AutocompleteSessionToken();
    sessionTokenRef.current = token;

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: searchText,
        includedRegionCodes: [GOOGLE_MAPS_REGION.toLowerCase()],
        language: GOOGLE_MAPS_LANGUAGE,
        region: GOOGLE_MAPS_REGION,
        locationRestriction: googleVietnamBounds,
        sessionToken: token
      })
        .then(({ suggestions }) => {
          if (cancelled) {
            return;
          }
          setPredictions(
            suggestions
              .map((suggestion) => suggestion.placePrediction)
              .filter((prediction): prediction is PlacePrediction => prediction !== null)
          );
          setError(null);
        })
        .catch(() => {
          if (!cancelled) {
            setError("Không thể tải gợi ý địa chỉ.");
            setPredictions([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [placesLibrary, queryText, selectedQuery]);

  async function selectPrediction(prediction: PlacePrediction) {
    setError(null);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location", "addressComponents"]
      });
      const selection = toSelection(place);
      if (!selection) {
        setError("Google Maps chưa trả về tọa độ cho địa điểm này.");
        return;
      }

      onSelect(selection);
      const nextQuery = selection.address || selection.name;
      setSelectedQuery(nextQuery);
      syncQuery(nextQuery);
      setPredictions([]);
      sessionTokenRef.current = null;
    } catch {
      setError("Không thể lấy chi tiết địa điểm.");
    }
  }

  if (!hasGoogleMapsApiKey()) {
    return (
      <p className="rounded-lg border border-[var(--line)] bg-white p-3 text-sm text-[var(--muted)]">
        {label} sẽ hoạt động sau khi cấu hình API key.
      </p>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="a97-label">
        <span className="flex items-center gap-2">
          <Search size={17} aria-hidden />
          {label}
        </span>
        <input
          className="a97-input"
          placeholder={placeholder}
          value={queryText}
          onBlur={(event) => {
            const relatedTarget = event.relatedTarget as Node | null;
            if (relatedTarget && wrapperRef.current?.contains(relatedTarget)) {
              return;
            }

            window.setTimeout(() => setPredictions([]), 180);
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            syncQuery(nextQuery);
            if (nextQuery.trim() !== selectedQuery) {
              setSelectedQuery("");
            }
            if (nextQuery.trim().length < 3) {
              setPredictions([]);
            }
          }}
          onFocus={ensurePlacesLibrary}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setPredictions([]);
            }
          }}
        />
      </label>
      {isLoadingLibrary || isSearching ? (
        <p className="mt-2 text-sm text-[var(--muted)]">Đang tải gợi ý...</p>
      ) : null}
      {error ? <p className="mt-2 text-sm font-bold text-red-700">{error}</p> : null}
      {predictions.length > 0 && queryText.trim().length >= 3 ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-lg">
          {predictions.map((prediction) => (
            <button
              key={prediction.placeId}
              type="button"
              className="flex w-full items-start gap-2 border-b border-[var(--line)] px-3 py-3 text-left text-sm last:border-0 hover:bg-[#f4fbf8]"
              onMouseDown={(event) => event.preventDefault()}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => void selectPrediction(prediction)}
            >
              <MapPin className="mt-0.5 shrink-0 text-[var(--primary)]" size={17} aria-hidden />
              <span>
                <span className="block font-bold">{prediction.mainText?.text ?? prediction.text.text}</span>
                {prediction.secondaryText?.text ? (
                  <span className="mt-1 block text-[var(--muted)]">
                    {prediction.secondaryText.text}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
