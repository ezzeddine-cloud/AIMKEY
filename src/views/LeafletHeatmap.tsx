"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import Papa from "papaparse";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { BarChart3 } from "lucide-react";

// Fix for default Leaflet icon in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface DataRow {
  zone: string;
  lat: number;
  lon: number;
  pm25: number;
  level: string;
}

// Custom hook to add the heat layer
function HeatmapLayer({ data }: { data: DataRow[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || data.length === 0) return;

    const heatData = data.map((row) => [row.lat, row.lon, row.pm25] as [number, number, number]);
    
    // @ts-ignore - leaflet.heat adds heatLayer to L
    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 13,
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, data]);

  return null;
}

export default function LeafletHeatmap() {
  const [latestData, setLatestData] = useState<DataRow[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/data.csv");
        if (!response.ok) return;
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data as string[][];
            
            const parsedData: DataRow[] = rows.map((row) => ({
              zone: row[0],
              lat: parseFloat(row[1]),
              lon: parseFloat(row[2]),
              pm25: parseFloat(row[3]),
              level: row[4],
            }));

            // Group by zone and keep the latest
            const latestPerZone = new Map<string, DataRow>();
            parsedData.forEach((row) => {
              latestPerZone.set(row.zone, row);
            });

            setLatestData(Array.from(latestPerZone.values()));
          },
        });
      } catch (error) {
        console.error("Error loading CSV data:", error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/40 overflow-hidden flex flex-col h-full shadow-xl shadow-emerald-900/5 relative z-0">
      <div className="p-6 border-b border-white/40 flex justify-between items-center bg-white/20 relative z-10">
        <div>
          <h3 className="font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-tight">
            <BarChart3 size={18} className="text-emerald-500" />
            POLLUTION_LIVE
          </h3>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5 uppercase tracking-widest italic">Gabès Gulf Sector Z1</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[400px] relative z-0">
        <MapContainer
          center={[33.88, 10.10]}
          zoom={12}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <HeatmapLayer data={latestData} />
          
          {latestData.map((row, idx) => (
            <Marker key={idx} position={[row.lat, row.lon]}>
              <Popup>
                <div className="font-bold text-sm">
                  {row.zone} &rarr; {row.level} ({row.pm25})
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
