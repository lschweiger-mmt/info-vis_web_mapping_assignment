// Initialize the map
var map = L.map('map').setView([47.7998, 13.0453], 14); // Centered on Salzburg Altstadt

// Define the tile layer
var baseMap1 = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
});

// Add default basemap
baseMap1.addTo(map);

// Define custom icons for regular cafes and favorite cafes
const cafeIcon = L.icon({
  iconUrl: 'images/cafe-icon.png',
  iconSize: [25, 25],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const favCafeIcon = L.icon({
  iconUrl: 'images/favcafe-icon2.png',
  iconSize: [32, 26],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Load the all-fav.geojson and favcafes.geojson files
loadGeoJSON('all-fav.geojson', cafeIcon);
loadGeoJSON('favcafes.geojson', favCafeIcon);

// Function to handle popups for features
function onEachFeature(feature, layer) {
  if (feature.properties && feature.properties.name) {
    layer.bindPopup(`<b>${feature.properties.name}</b>`);
  }
}

// Function to load and display GeoJSON data
function loadGeoJSON(url, icon) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'json';

  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      var data = xhr.response;
      L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          return L.marker(latlng, { icon: icon });
        },
        onEachFeature: onEachFeature
      }).addTo(map);
    } else {
      console.error(`❌ Error loading ${url}: ${xhr.status} ${xhr.statusText}`);
    }
  };

  xhr.onerror = function () {
    console.error(`❌ Network error while loading ${url}`);
  };

  xhr.send();
}

// Add a metric scale bar at the bottom left
L.control.scale({
  metric: true,   
  imperial: false 
}).addTo(map);

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

// Call the legend function
addLegend(map);

// Trigger map resize when the window resizes
window.addEventListener('resize', function () {
  map.invalidateSize();
});
