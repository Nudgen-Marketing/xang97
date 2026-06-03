export type UserLocationKind = "place" | "geolocation";

export function shouldFitRadiusForCamera({ hasUserLocation, hasRadiusBounds }: {
  hasUserLocation: boolean;
  hasRadiusBounds: boolean;
}) {
  return hasUserLocation && hasRadiusBounds;
}

export function getRadiusCameraPadding({ width, height }: {
  width: number;
  height: number;
}) {
  const shortestSide = Math.min(width, height);

  if (shortestSide < 420) {
    return 32;
  }

  if (shortestSide < 720) {
    return 48;
  }

  return 64;
}
