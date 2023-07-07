import { useState, useCallback } from "react";
import { flushSync } from "react-dom";

import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    InfoWindow,
} from "@react-google-maps/api";

import "./App.css";

// Load the JSON incident data.
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
    const [selectedIncident, setSelectedIncident] = useState(null);

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
     * When an incident's info window is closed, deselect the incident.
     */
    const handleInfoWindowCloseClick = () => {
        setSelectedIncident(null);
    };

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

    /**
     * When a marker has loaded, associate it with the incident that
     * it relates to, so that we can anchor the <InfoWindow> to the
     * marker when displaying it.
     *
     * @param {google.maps.Marker} marker The loaded marker.
     * @param {Object} incident The incident that the marker relates to.
     */
    const saveIncidentMarker = (marker, incident) => {
        incident.marker = marker;
    };

    const handleMarkerClick = (e, incident) => {
        // Force a re-render for this first state update
        // to ensure any existing <InfoWindow> is unmounted.
        flushSync(() => setSelectedIncident(null));

        // Now display the new <InfoWindow>.
        setSelectedIncident(incident);
    };

    return isLoaded ? (
        <div className="app">
            <div className="incidentList">
                <h2>Incidents</h2>
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
                            onLoad={(marker) =>
                                saveIncidentMarker(marker, incident)
                            }
                            onClick={(e) => handleMarkerClick(e, incident)}
                        ></Marker>
                    ))}
                    {selectedIncident && (
                        <InfoWindow
                            anchor={selectedIncident.marker}
                            onCloseClick={handleInfoWindowCloseClick}
                        >
                            <>
                                <h2>{selectedIncident.alert_type}</h2>
                                <h3>{selectedIncident.title}</h3>
                                <p>{selectedIncident.description}</p>
                            </>
                        </InfoWindow>
                    )}
                </>
            </GoogleMap>
        </div>
    ) : (
        <></>
    );
}

export default App;
