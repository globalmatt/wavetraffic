# Wave Traffic app

**Display traffic incidents on a map, along with a list of incidents.**

Features:

-   A pannable and zoomable map using Google Maps.

-   Custom incident icons.

-   Clustered markers.

-   Cicking an incident marker opens an info window with more details.

-   The incidents currently shown on the map are also shown in a list.
    The currently-selected marker is highlighted in the list.

-   Clicking an incident in the list pans the map to the incident and
    opens its info window.

-   The app is mobile-responsive.

## 1. Building

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v16.13 or higher).

-   [NPM](https://www.npmjs.com/) (v8.1 or higher).

-   A [Google Maps API key](https://developers.google.com/maps/documentation/javascript/get-api-key). If using key restrictions, make sure you include your app's URL(s) in the list of allowed websites (**Credentials > API Keys > (click your API key) > Key restrictions**).

### Instructions

1. Clone the repository.

2. Run `npm install` in the repository root folder to install the dependencies.

3. Create a `.env` file in the repository root folder, with the following contents:

    `VITE_GOOGLE_MAPS_API_KEY=<your Google Maps API key here>`

4. Run `npm run build` to build a static version of the app in the `dist` folder.

## 2. Running locally

Run `npm run dev` to start a local development server.

## 3. Live demo

A live demo of the app is available at [https://www.elated.com/wavetraffic/](https://www.elated.com/wavetraffic/).

## 4. Future enhancements

Some suggested enhancements for the app if more time becomes available:

-   Add filtering by incident type.

-   Add light/dark-mode support to the incident list and list header.

-   Add Jest tests.

## 5. Author

Matt Doyle (matt@elated.com).

## 6. Credits

-   Tow Truck icon by [Icons8](https://icons8.com/icon/16695/tow-truck).

-   All other icons from [Fluenticons](https://fluenticons.co/).
