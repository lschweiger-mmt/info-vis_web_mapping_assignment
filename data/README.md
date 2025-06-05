# GeoJSON Data Folder

This folder contains the GeoJSON files for different regions displayed on the map.

## How to Add a New Region

1. Create a new GeoJSON file with the data for your region
2. Name the file using the region name, e.g., `region-name.geojson` (use lowercase and hyphens)
3. Place the file in this folder
4. Refresh the web page - the new region will automatically appear in the selector

## Format Requirements

The GeoJSON files should contain point features with the following properties:

- `name` or `name:en`: The name of the restaurant
- `cuisine`: Semicolon-separated list of cuisines (e.g., "vegan;asian;chinese")
- `opening_hours`: Opening hours information
- `phone`: Contact phone number
- `website`: Restaurant website URL
- `addr_street`, `addr_housenumber`: Address information

Additional properties may be included but are not currently displayed in the popup.
