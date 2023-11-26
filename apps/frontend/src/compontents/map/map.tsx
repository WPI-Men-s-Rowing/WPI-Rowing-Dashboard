import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

mapboxgl.accessToken = import.meta.env.VITE_MAP_KEY;

function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng] = useState(-71.75);
  const [lat] = useState(42.27);
  const [zoom] = useState(12);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/emersonshatouhy/clnusmnh2000u01qxeav5b81o",
      center: [lng, lat],
      zoom: zoom,
    });
  });

  return <div ref={mapContainer} className="h-full w-full" />;
}

export default Map;
