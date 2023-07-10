// Vendors.
import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
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
    const incidentListRef = useRef();
    const incidentListULRef = useRef();
    const infoWindow = useRef(false);

    /**
     * When the map has loaded:
     *
     * 1. Store the map.
     * 2. Create the info window object.
     * 3. Extend the bounds to fit all of the incidents.
     * 4. Create a marker for each incident.
     * 5. Create a marker clusterer.
     */
    const handleMapLoad = (map) => {
        const GoogleMaps = window.google.maps;

        // Store the map.
        setMap(map);

        // Create the info window and add a close event listener to it.

        infoWindow.current = new GoogleMaps.InfoWindow();

        GoogleMaps.event.addListener(
            infoWindow.current,
            "closeclick",
            handleInfoWindowCloseClick
        );

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
    };

    /**
     * When the map has unmounted, remove its reference.
     */
    const handleMapUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    /**
     * After the map is panned or zoomed, update the list of visible
     * incidents.
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
     * Check if a given element is scrolled into view.
     *
     * @see https://stackoverflow.com/a/76546933/10310114
     * @param {Element} - The element to check.
     * @returns {Promise<boolean>} - Whether the element is in view.
     */
    async function isElementInScrollView(element) {
        return new Promise((resolve) => {
            const observer = new IntersectionObserver(
                (entries, observerItself) => {
                    observerItself.disconnect();
                    resolve(entries[0].intersectionRatio === 1);
                }
            );
            observer.observe(element);
        });
    }

    /**
     * Whenever the selected incident or incident list changes,
     * scroll to the selected incident in the list (unless it's
     * already in view).
     */
    useEffect(() => {
        if (
            selectedIncident &&
            incidentListItemRefs.current[parseInt(selectedIncident.id)]
        ) {
            const ulOverflowY = window
                .getComputedStyle(incidentListULRef.current)
                .getPropertyValue("overflow-y");

            (async () => {
                const isInView = await isElementInScrollView(
                    incidentListItemRefs.current[parseInt(selectedIncident.id)]
                );

                if (!isInView) {
                    // Scroll the innner <ul> if it's scrollable (i.e. on
                    // desktop). Otherwise, scroll the outer `.incidentList`
                    // <div> (i.e. on mobile).
                    if (ulOverflowY === "scroll") {
                        incidentListULRef.current.scrollTo({
                            top: incidentListItemRefs.current[
                                parseInt(selectedIncident.id)
                            ].offsetTop,
                        });
                    } else {
                        incidentListRef.current.scrollTo({
                            top: incidentListItemRefs.current[
                                parseInt(selectedIncident.id)
                            ].offsetTop,
                        });
                    }
                }
            })();
        }
    }, [selectedIncident, visibleIncidents, isIncidentListVisible]);

    /**
     * Escape text for use inside a DOM element.
     *
     * @see https://stackoverflow.com/a/30970751/10310114
     * @param {string} text The text to escape.
     * @returns {string} The escaped text.
     */
    function escape(s) {
        return s.replace(/[^0-9A-Za-z ]/g, (c) => "&#" + c.charCodeAt(0) + ";");
    }

    /**
     * Set the content inside the info window based on the supplied incident.
     * @param {*} incident The incident to use.
     */
    const setInfoWindowContent = (incident) => {
        infoWindow.current.setContent(
            `<div class="infoWindow"><h2>${escape(
                formatAlertType(incident.alert_type)
            )}</h2><h3>${escape(incident.title)}</h3><p>${escape(
                incident.description
            )}</p></div>`
        );
    };

    /**
     * When a marker is clicked, display an info window with the
     * incident details.
     *
     * @param {Object} incident The incident that the marker relates to.
     */
    const handleMarkerClick = (incident) => {
        setInfoWindowContent(incident);

        infoWindow.current.open({
            anchor: incident.marker,
            map,
        });

        setSelectedIncident(incident);
    };

    /**
     * When an incident in the incident list is clicked,
     * select it, move the map to its marker, and display its
     * info window.
     *
     * @param {Object} incident The incident that was clicked.
     */
    const handleIncidentListItemClick = (incident) => {
        setSelectedIncident(incident);
        setIsIncidentListVisible(false);

        map.panTo(incident.marker.position);
        if (map.getZoom() < 14) map.setZoom(14);

        setInfoWindowContent(incident);

        infoWindow.current.open({
            anchor: incident.marker,
            map,
        });
    };

    /**
     * When an incident's info window is closed, deselect the incident.
     */
    function handleInfoWindowCloseClick() {
        setSelectedIncident(null);
    }

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
                    ref={incidentListRef}
                >
                    <h2>
                        {visibleIncidents.length} incident
                        {visibleIncidents.length === 1 ? "" : "s"} shown.
                    </h2>
                    <ul ref={incidentListULRef}>
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
                                onClick={() =>
                                    handleIncidentListItemClick(incident)
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
            ></GoogleMap>
        </div>
    ) : (
        <></>
    );
}

export default App;
