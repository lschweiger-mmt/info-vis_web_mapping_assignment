// Initialize the map
var map = L.map('map').setView([47.7998, 13.0453], 14); // Centered on Salzburg Altstadt

// Define the tile layer

var baseMap1 = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
});

var baseMap2 = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  opacity: 0.7
});

// Add default basemap
baseMap1.addTo(map);

// Initialize the marker cluster group
var markers = L.markerClusterGroup();

// Ensure the side-by-side plugin is properly referenced
if (typeof L.control.sideBySide !== 'undefined') { 
    console.log("✅ Leaflet Side-by-Side plugin is loaded.");

    // Add both base maps to the map (IMPORTANT)
    baseMap1.addTo(map);
    baseMap2.addTo(map);

    // Add the Side-by-Side Control
    L.control.sideBySide(baseMap1, baseMap2).addTo(map);
} else {
    console.error("❌ Error: leaflet-side-by-side plugin is missing.");
}

// Define a custom cafe icon for regular cafes
const cafeIcon = L.icon({
  iconUrl: 'images/cafe-icon.png', // Path to your default cafe icon
  iconSize: [25, 25], // Size of the icon [width, height]
  iconAnchor: [16, 32], // Point of the icon which will correspond to the marker's location
  popupAnchor: [0, -32] // Point from which the popup should open relative to the iconAnchor
});

// Define a custom icon for favorite cafes
const favCafeIcon = L.icon({
  iconUrl: 'images/favcafe-icon2.png', // Path to your favorite cafe icon
  iconSize: [32, 26], // Size of the icon [width, height]
  iconAnchor: [16, 32], // Point of the icon which will correspond to the marker's location
  popupAnchor: [0, -32] // Point from which the popup should open relative to the iconAnchor
});

// Function to style polygons in GeoJSON
function styleFeature(feature) {
  if (feature.geometry.type === 'Polygon') {
    return {
      color: 'blue',
      weight: 2,
      fillOpacity: 0.5
    };
  }
  return {};
}

// Function to handle popups for features
function onEachFeature(feature, layer) {
  if (feature.properties && feature.properties.name) {
    layer.bindPopup(`<b>${feature.properties.name}</b>`);
  }
}

// Function to load GeoJSON using XHR and add to marker cluster
function loadGeoJSON(url, icon) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'json';

  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      var data = xhr.response;
      var geoJsonLayer = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          var marker = L.marker(latlng, { icon: icon });
          return marker;
        },
        onEachFeature: onEachFeature
      });

      // Add the GeoJSON layer to the marker cluster group
      markers.addLayer(geoJsonLayer);
    } else {
      console.error(`❌ Error loading ${url}: ${xhr.status} ${xhr.statusText}`);
    }
  };

  xhr.onerror = function () {
    console.error(`❌ Network error while loading ${url}`);
  };

  xhr.send();
}

// Load the all-fav.geojson file
loadGeoJSON('all-fav.geojson', cafeIcon, styleFeature);

// Load the favcafes.geojson file
loadGeoJSON('favcafes.geojson', favCafeIcon, null);

// Add the marker cluster group to the map
map.addLayer(markers);

// Add a metric scale bar at the bottom left
L.control.scale({
  metric: true,   // Show metric units
  imperial: false // Hide imperial units
}).addTo(map);

// Add a title and slider for opacity control
const sliderContainer = document.createElement('div');
sliderContainer.style.position = 'absolute';
sliderContainer.style.top = '10px';
sliderContainer.style.left = 'unset'; // Unset the left position
sliderContainer.style.right = '10px'; // Set the right position
sliderContainer.style.zIndex = '1000';
sliderContainer.style.background = 'white';
sliderContainer.style.padding = '10px';
sliderContainer.style.borderRadius = '5px';
sliderContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

// Add a title to the slider
const sliderTitle = document.createElement('div');
sliderTitle.innerText = 'Change the transparency of the base map';
sliderTitle.style.fontFamily = 'Palatino Linotype'; // Change font family
sliderTitle.style.fontSize = '10pt'; // Change font size
sliderTitle.style.backgroundColor = 'transparent'; // Explicitly set the background color to transparent
sliderTitle.style.marginBottom = '5px';
sliderTitle.style.fontSize = '14px';
sliderTitle.style.color = 'darkgray'; // Set font color to dark gray
sliderTitle.style.fontWeight = 'normal';
sliderContainer.appendChild(sliderTitle);

// Add the slider
const slider = document.createElement('input');
slider.type = 'range';
slider.min = '0';
slider.max = '1';
slider.step = '0.1';
slider.value = '0.7'; // Initial opacity value
slider.style.width = '100%';
sliderContainer.appendChild(slider);

// Add the container to the document
document.body.appendChild(sliderContainer);

// Listen to slider changes and update tile layer opacity
slider.addEventListener('input', function (e) {
  const opacity = parseFloat(e.target.value);
  baseMap2.setOpacity(opacity);  // 
});

// Add a legend
function addLegend(map) {
  const legend = L.control({ position: 'bottomright' });

  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    div.style.background = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    div.style.fontFamily = 'Palatino Linotype';
    div.style.color = 'darkgray';
    div.style.zIndex = '1000';
    div.innerHTML = `
      <h4 style="margin: 0; font-size: 12pt; color: darkgray;">Legend</h4>
      <div style="display: flex; align-items: center; margin-top: 5px;">
        <img src="images/cafe-icon.png" alt="Cafe" style="width: 25px; height: 25px; margin-right: 8px;">
        <span style="font-size: 10pt;">Cafes</span>
      </div>
      <div style="display: flex; align-items: center; margin-top: 5px;">
        <img src="images/favcafe-icon2.png" alt="Fav Cafe" style="width: 32px; height: 26px; margin-right: 8px;">
        <span style="font-size: 10pt;">Favorite Cafes</span>
      </div>
    `;
    return div;
  };

  legend.addTo(map);
}

// Call the function only ONCE
addLegend(map);

// Trigger map resize when the window resizes
window.addEventListener('resize', function () {
  map.invalidateSize();
});


