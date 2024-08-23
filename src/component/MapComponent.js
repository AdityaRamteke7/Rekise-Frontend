import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import point1 from "./assets/point.png";
import point2 from "./assets/point2.png";
import rocket from "./assets/rocket.png";
import './MapComponent.css'; 

const MapComponent = () => {
    const mapRef = useRef(null);
    const markerRef = useRef(null);

    const startCoordinates = useMemo(() => [22.1696, 91.4996], [])
    const endCoordinates = useMemo(() => [22.2637, 91.7159], []);
    const speed = 20; 
    const refreshRate = 2; 


    const calculateBearing = (start, end) => {
        const [startLat, startLng] = start.map(coord => (Math.PI / 180) * coord);
        const [endLat, endLng] = end.map(coord => (Math.PI / 180) * coord);

        const y = Math.sin(endLng - startLng) * Math.cos(endLat);
        const x = Math.cos(startLat) * Math.sin(endLat) -
            Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
        const bearing = Math.atan2(y, x) * (180 / Math.PI);
        return (bearing + 360) % 360; 
    };

    useEffect(() => {
        if (mapRef.current) return;

        const map = L.map('map').setView(startCoordinates, 11);
        mapRef.current = map;

        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: 'Leaflet &copy; OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(map);

        const createIcon = (iconUrl, size = [40, 40]) => L.icon({ iconUrl, iconSize: size });

        L.marker(startCoordinates, { icon: createIcon(point2) }).addTo(map);
        L.marker(endCoordinates, { icon: createIcon(point1) }).addTo(map);

        const rocketIcon = L.divIcon({
            html: `<img src="${rocket}" style="transform: rotate(${calculateBearing(startCoordinates, endCoordinates)}deg);" />`,
            iconSize: [50, 50],
            className: 'custom-marker', 
        });

        const marker = L.marker(startCoordinates, { icon: rocketIcon }).addTo(map);
        markerRef.current = marker;

        const distance = map.distance(startCoordinates, endCoordinates); 
        const totalTime = (distance / (speed * 1000)) * 3600; 
        const stepTime = 1000 / refreshRate; 

        const latStep = (endCoordinates[0] - startCoordinates[0]) / (totalTime * refreshRate / 1000);
        const lngStep = (endCoordinates[1] - startCoordinates[1]) / (totalTime * refreshRate / 1000);

        let [currentLat, currentLng] = startCoordinates;

        const moveMarker = () => {
            const closeEnough = (coord1, coord2, step) => Math.abs(coord1 - coord2) < Math.abs(step);
            if (closeEnough(currentLat, endCoordinates[0], latStep) && closeEnough(currentLng, endCoordinates[1], lngStep)) {
                markerRef.current.setLatLng(endCoordinates); 
                return;
            }

            currentLat += latStep;
            currentLng += lngStep;

            markerRef.current.setLatLng([currentLat, currentLng]);
            setTimeout(moveMarker, stepTime);
        };

        moveMarker();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [endCoordinates, startCoordinates]);

    return (
        <div className="map-container">
            <InfoPanel
                startCoordinates={startCoordinates}
                endCoordinates={endCoordinates}
                speed={speed}
            />
            <div id="map" className="map-element" />
        </div>
    );
};

const InfoPanel = ({ startCoordinates, endCoordinates, speed }) => (
    <div className="info-panel">
        <div>
            <strong>Starting</strong>
            <div>Lat: {startCoordinates[0].toFixed(4)}</div>
            <div>Long: {startCoordinates[1].toFixed(4)}</div>
        </div>
        <div className="speed">
            Speed: {speed} km/h
        </div>
        <div>
            <strong>Ending</strong>
            <div>Lat: {endCoordinates[0].toFixed(4)}</div>
            <div>Long: {endCoordinates[1].toFixed(4)}</div>
        </div>
    </div>
);

export default MapComponent;
