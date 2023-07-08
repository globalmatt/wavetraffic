import { useState, useCallback } from "react";
import { flushSync } from "react-dom";

import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    InfoWindow,
} from "@react-google-maps/api";

import "./App.css";

// Load the incident icon SVGs.
import TowTruck from "./assets/tow-truck.svg";
import RoadCone from "./assets/road-cone.svg";
import Balloon from "./assets/balloon.svg";
import Flash from "./assets/flash.svg";
import Exclamation from "./assets/exclamation.svg";

// Load the JSON incident data.
import incidentsJSON from "./data/incidents.json";
const incidents = incidentsJSON.incidents;

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
    const [isIncidentListVisible, setIsIncidentListVisible] = useState(false);

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

    /**
     * When a marker is clicked, display an info window with the
     * incident details.
     *
     * @param {Object} incident The incident that the marker relates to.
     */
    const handleMarkerClick = (incident) => {
        // Force a re-render for this first state update
        // to ensure any existing <InfoWindow> is unmounted.
        flushSync(() => setSelectedIncident(null));

        // Now display the new <InfoWindow>.
        setSelectedIncident(incident);
    };

    /**
     * Format an alert type for better UX:
     *
     * - Replace "tow_allocation" with "Tow Allocation".
     * - Capitalise the first letter.
     *
     * @param {String} alert The raw alert type.
     * @returns {String} The formatted alert type.
     */
    const formatAlertType = (alert) => {
        if (alert === "tow_allocation") {
            return "Tow Allocation";
        } else {
            return alert.charAt(0).toUpperCase() + alert.slice(1);
        }
    };

    /**
     * Given an incident, return an icon that is appropriate for the
     * incident's type.
     *
     * @param {Object} incident The incident.
     * @returns {String} The icon.
     */
    const getIcon = (incident) => {
        switch (incident.alert_type) {
            case "tow_allocation":
                return TowTruck;
            case "roadworks":
                return RoadCone;
            case "event":
                return Balloon;
            case "emergency":
                return Flash;
            case "alert":
                return Exclamation;
        }
    };

    return isLoaded ? (
        <div className="app">
            <div className="incidentListWrap">
                <div className="incidentListHeader">
                    <span>
                        {visibleIncidents.length} incident
                        {visibleIncidents.length === 1 ? "" : "s"} shown.
                    </span>
                    <button
                        onClick={() =>
                            setIsIncidentListVisible(!isIncidentListVisible)
                        }
                    >
                        {isIncidentListVisible ? "Hide" : "Show"} Incidents
                    </button>
                </div>
                <div
                    className={`incidentList ${
                        isIncidentListVisible ? "visible" : ""
                    }`}
                >
                    <h2>Incidents</h2>
                    <ul>
                        {visibleIncidents.map((incident) => (
                            <li key={incident.id}>
                                <img
                                    src={getIcon(incident)}
                                    alt={formatAlertType(incident.alert_type)}
                                ></img>
                                <div>
                                    <h2>
                                        {formatAlertType(incident.alert_type)}
                                    </h2>
                                    <p>{incident.title}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <GoogleMap
                mapContainerClassName="mapContainer"
                zoom={10}
                onLoad={handleMapLoad}
                onUnmount={handleMapUnmount}
                onIdle={updateList}
            >
                <>
                    {incidents.map((incident) => (
                        <Marker
                            icon={getIcon(incident)}
                            key={incident.id}
                            position={{
                                lat: parseFloat(incident.lat),
                                lng: parseFloat(incident.long),
                            }}
                            onLoad={(marker) =>
                                saveIncidentMarker(marker, incident)
                            }
                            onClick={() => handleMarkerClick(incident)}
                        ></Marker>
                    ))}
                    {selectedIncident && (
                        <InfoWindow
                            anchor={selectedIncident.marker}
                            onCloseClick={handleInfoWindowCloseClick}
                        >
                            <>
                                <h2>
                                    {formatAlertType(
                                        selectedIncident.alert_type
                                    )}
                                </h2>
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
