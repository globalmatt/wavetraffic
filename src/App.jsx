// Vendors.
import { useState, useCallback, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import { GoogleMap, useJsApiLoader, InfoWindowF } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

// App styles.
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
    // Load the Google Maps API before rendering anything.
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    });

    // Component state.
    const [map, setMap] = useState(null);
    const [visibleIncidents, setVisibleIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [isIncidentListVisible, setIsIncidentListVisible] = useState(false);
    const incidentListItemRefs = useRef([]);

    /**
     * When the map has loaded:
     *
     * 1. Store the map.
     * 2. Extend the bounds to fit all of the incidents.
     * 3. Create a marker for each incident.
     * 4. Create a marker clusterer.
     */
    const handleMapLoad = useCallback(function callback(map) {
        const GoogleMaps = window.google.maps;

        // Store the map.
        setMap(map);

        // Extend the bounds. (Wait 500ms to give iOS Safari enough time
        // to initialise the map on page reload, otherwise it displays
        // the whole world. TODO: Find a more robust solution for this.)

        setTimeout(() => {
            const bounds = new GoogleMaps.LatLngBounds();

            incidents.forEach((incident) => {
                bounds.extend({
                    lat: parseFloat(incident.lat),
                    lng: parseFloat(incident.long),
                });
            });

            map.fitBounds(bounds);
        }, 500);

        // Create the markers.

        incidents.forEach((incident) => {
            const marker = new GoogleMaps.Marker({
                map: map,
                position: new GoogleMaps.LatLng(
                    parseFloat(incident.lat),
                    parseFloat(incident.long)
                ),
                icon: getIcon(incident),
            });

            GoogleMaps.event.addListener(marker, "click", () =>
                handleMarkerClick(incident)
            );

            incident.marker = marker;
        });

        // Create the marker clusterer.

        new MarkerClusterer({
            map,
            markers: incidents.map((incident) => incident.marker),
            algorithmOptions: { maxZoom: 10 },
        });
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
        if (!bounds) return;

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
     * Whenever the selected incident or incident list changes,
     * scroll to the selected incident in the list.
     */
    useEffect(() => {
        if (
            selectedIncident &&
            incidentListItemRefs.current[parseInt(selectedIncident.id)]
        ) {
            incidentListItemRefs.current[
                parseInt(selectedIncident.id)
            ].scrollIntoView({});
        }
    }, [selectedIncident, visibleIncidents]);

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
     * When an incident's info window is closed, deselect the incident.
     */
    const handleInfoWindowCloseClick = () => {
        setSelectedIncident(null);
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
                        {isIncidentListVisible
                            ? "Close"
                            : "View Incident" +
                              (visibleIncidents.length === 1 ? "" : "s")}
                    </button>
                </div>
                <div
                    className={`incidentList ${
                        isIncidentListVisible ? "visible" : ""
                    }`}
                >
                    <h2>
                        {visibleIncidents.length} incident
                        {visibleIncidents.length === 1 ? "" : "s"} shown.
                    </h2>
                    <ul>
                        {visibleIncidents.map((incident) => (
                            <li
                                key={incident.id}
                                ref={(el) =>
                                    (incidentListItemRefs.current[
                                        parseInt(incident.id)
                                    ] = el)
                                }
                                className={
                                    selectedIncident &&
                                    selectedIncident.id === incident.id
                                        ? "selected"
                                        : ""
                                }
                            >
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
                    {selectedIncident && (
                        <InfoWindowF
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
                        </InfoWindowF>
                    )}
                </>
            </GoogleMap>
        </div>
    ) : (
        <></>
    );
}

export default App;
