import { useEffect, useRef } from "react";

type Props = {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  courier?: { lat: number; lng: number };
  className?: string;
};

declare global {
  interface Window {
    google?: any;
    __initCookieMap?: () => void;
  }
}

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;

let loaderPromise: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise<void>((resolve, reject) => {
    window.__initCookieMap = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__initCookieMap&channel=${TRACKING_ID ?? ""}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Falha ao carregar Google Maps"));
    document.head.appendChild(s);
  });
  return loaderPromise;
}

export function DeliveryMap({ origin, destination, courier, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !ref.current || !window.google?.maps) return;
        const g = window.google.maps;
        const center = courier ?? {
          lat: (origin.lat + destination.lat) / 2,
          lng: (origin.lng + destination.lng) / 2,
        };
        const map = new g.Map(ref.current, {
          center,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
        });

        new g.Marker({ position: origin, map, label: "🍪", title: "GranCookie" });
        new g.Marker({ position: destination, map, label: "🏠", title: "Sua casa" });
        if (courier) new g.Marker({ position: courier, map, label: "🛵", title: "Entregador" });

        new g.Polyline({
          path: [origin, courier ?? destination, destination],
          map,
          strokeColor: "#f97316",
          strokeOpacity: 0.8,
          strokeWeight: 4,
        });

        const bounds = new g.LatLngBounds();
        [origin, destination, courier].filter(Boolean).forEach((p: any) => bounds.extend(p));
        map.fitBounds(bounds, 60);
      })
      .catch((e) => console.error(e));
    return () => {
      cancelled = true;
    };
  }, [origin, destination, courier]);

  if (!BROWSER_KEY) {
    return (
      <div className={className}>
        <div className="rounded-lg border bg-muted p-6 text-center text-sm text-muted-foreground">
          Mapa indisponível (chave do Google Maps não configurada).
        </div>
      </div>
    );
  }

  return <div ref={ref} className={className ?? "h-72 w-full rounded-lg border"} />;
}
