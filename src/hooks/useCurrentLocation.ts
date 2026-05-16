import { useCallback, useEffect, useState } from "react";

export type CurrentLocationCoords = {
  lat: number;
  lon: number;
};

type UseCurrentLocationOptions = {
  auto?: boolean;
  timeout?: number;
  maximumAge?: number;
  enableHighAccuracy?: boolean;
};

const DEFAULT_OPTIONS: Required<UseCurrentLocationOptions> = {
  auto: true,
  timeout: 8000,
  maximumAge: 5 * 60 * 1000,
  enableHighAccuracy: false,
};

export function useCurrentLocation(options: UseCurrentLocationOptions = {}) {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const [coords, setCoords] = useState<CurrentLocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(settings.auto);

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined") return;

    setLoading(true);
    setError(null);

    if (!("geolocation" in navigator)) {
      setCoords(null);
      setError("Geolocation is not supported.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (positionError) => {
        setCoords(null);
        setLoading(false);

        if (positionError.code === positionError.PERMISSION_DENIED) {
          setError("Location access denied — unable to fetch live weather.");
          return;
        }

        if (positionError.code === positionError.POSITION_UNAVAILABLE) {
          setError("Location unavailable — unable to fetch live weather.");
          return;
        }

        setError("Unable to detect your current location.");
      },
      {
        enableHighAccuracy: settings.enableHighAccuracy,
        timeout: settings.timeout,
        maximumAge: settings.maximumAge,
      },
    );
  }, [settings.enableHighAccuracy, settings.maximumAge, settings.timeout]);

  useEffect(() => {
    if (!settings.auto || typeof window === "undefined") {
      setLoading(false);
      return;
    }

    requestLocation();
  }, [requestLocation, settings.auto]);

  return {
    coords,
    error,
    loading,
    retry: requestLocation,
  };
}