import { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

import "./App.css";

import incidentsJSON from "./data/incidents.json";
const incidents = incidentsJSON.incidents;

const containerStyle = {
    width: "400px",
    height: "400px",
};

/**
 * The main app component.
 *
 * @component App
 * @returns ReactElement The app content.
 */
function App() {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    });

    const [map, setMap] = useState(null);
    const [visibleIncidents, setVisibleIncidents] = useState([]);

    /**
     * When the map has loaded, set the bounds to fit all incidents.
     */
    const handleMapLoad = useCallback(function callback(map) {
        const bounds = new window.google.maps.LatLngBounds();

        incidents.forEach((incident) => {
            bounds.extend({
                lat: parseFloat(incident.lat),
                lng: parseFloat(incident.long),
            });
        });

        map.fitBounds(bounds);
        setMap(map);
    }, []);

    /**
     * When the map has unmounted, remove its reference.
     */
    const handleMapUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    /**
     * After the map is changed, update the list of visible incidents.
     */
    const updateList = () => {
        if (!map) return;

        const bounds = map.getBounds();

        setVisibleIncidents(
            incidents.filter((incident) =>
                bounds.contains({
                    lat: parseFloat(incident.lat),
                    lng: parseFloat(incident.long),
                })
            )
        );
    };

    return isLoaded ? (
        <div className="app">
            <div className="incidentList">
                <h1>Incidents</h1>
                <ul>
                    {visibleIncidents.map((incident) => (
                        <li key={incident.id}>
                            <h2>{incident.alert_type}</h2>
                            <p>{incident.title}</p>
                        </li>
                    ))}
                </ul>
            </div>
            <GoogleMap
                mapContainerStyle={containerStyle}
                zoom={10}
                onLoad={handleMapLoad}
                onUnmount={handleMapUnmount}
                onIdle={updateList}
            >
                <>
                    {incidents.map((incident) => (
                        <Marker
                            key={incident.id}
                            position={{
                                lat: parseFloat(incident.lat),
                                lng: parseFloat(incident.long),
                            }}
                        />
                    ))}
                </>
            </GoogleMap>
        </div>
    ) : (
        <></>
    );
}

export default App;
