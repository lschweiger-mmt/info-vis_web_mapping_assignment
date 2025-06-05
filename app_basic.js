// Initialize the map
var map = L.map('map').setView([47.7998, 13.0453], 14); // Centered on Salzburg Altstadt

var baseMap5 = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
});

baseMap5.addTo(map); // Dark Theme

const cafeCircleStyle = {
  radius: 8,
  fillColor: "#ffffff",
  color: "#555555",
  weight: 0,
  opacity: 1,
  fillOpacity: 1
};

const favCafeCircleStyle = {
  radius: 8,
  fillColor: "#ffeb3b",
  color: "#ffc107",
  weight: 0,
  opacity: 1,
  fillOpacity: 1
};

// Load the all-fav.geojson and favcafes.geojson files with circle markers
loadGeoJSON('export.geojson', cafeCircleStyle);

// Function to handle popups for features
function onEachFeature(feature, layer) {
  if (feature.properties && feature.properties.name) {
    layer.bindPopup(`<b>${feature.properties.name}</b>`);
  }
}

// Function to calculate circle radius based on zoom level
function getRadiusForZoom(baseRadius) {
  const currentZoom = map.getZoom();
  // Scale factor: circles get smaller at higher zoom levels and larger at lower zoom levels
  if (currentZoom <= 10) {
    return baseRadius * 0.6;
  } else if (currentZoom <= 12) {
    return baseRadius * 0.8;
  } else if (currentZoom <= 14) {
    return baseRadius;
  } else if (currentZoom <= 16) {
    return baseRadius * 1.2;
  } else {
    return baseRadius * 1.4;
  }
}

// Function to load and display GeoJSON data using circle markers
function loadGeoJSON(url, circleStyle) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'json';

  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      var data = xhr.response;
      
      // Create a GeoJSON layer with circle markers
      var geoJsonLayer = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          // Create a copy of the style to avoid modifying the original
          const style = Object.assign({}, circleStyle);
          
          // Set the radius based on current zoom level
          style.radius = getRadiusForZoom(circleStyle.radius);
          
          // Create the circle marker with the adjusted style
          return L.circleMarker(latlng, style);
        },
        onEachFeature: onEachFeature
      }).addTo(map);
      
      // Update circle sizes when zoom changes
      map.on('zoomend', function() {
        geoJsonLayer.eachLayer(function(layer) {
          if (layer instanceof L.CircleMarker) {
            // Determine which style to use based on the layer's current color
            const baseStyle = (layer.options.fillColor === "#ffeb3b") ? 
                              favCafeCircleStyle : cafeCircleStyle;
                              
            // Update the radius based on new zoom level
            layer.setRadius(getRadiusForZoom(baseStyle.radius));
          }
        });
      });
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

  // Update legend to use circles instead of icons
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    div.style.background = 'rgba(40, 40, 40, 0.8)';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    div.style.fontFamily = 'Palatino Linotype';
    div.style.color = 'white';
    div.style.zIndex = '1000';
    div.innerHTML = `
      <h4 style="margin: 0; font-size: 12pt; color: white;">Legend</h4>
      <div style="display: flex; align-items: center; margin-top: 8px;">
        <span style="
          display: inline-block;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #ffffff;
          border: 1px solid #555555;
          margin-right: 8px;
        "></span>
        <span style="font-size: 10pt;">Cafes</span>
      </div>
      <div style="display: flex; align-items: center; margin-top: 8px;">
        <span style="
          display: inline-block;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #ffeb3b;
          border: 1px solid #ffc107;
          margin-right: 8px;
        "></span>
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
