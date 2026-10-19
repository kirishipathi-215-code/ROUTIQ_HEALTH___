"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Next.js/Leaflet
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  userPos: [number, number];
  hospPos: [number, number];
  hospitalName: string;
}

export default function MapComponent({ userPos, hospPos, hospitalName }: MapComponentProps) {
  
  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={userPos} 
        zoom={13} 
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={userPos}>
          <Popup>Your Location</Popup>
        </Marker>
        <Marker position={hospPos}>
          <Popup>{hospitalName}</Popup>
        </Marker>
        <Polyline positions={[userPos, hospPos]} color="blue" weight={5} opacity={0.7} />
      </MapContainer>
    </div>
  );
}
