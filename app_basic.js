// Initialize the map
var map = L.map('map', {
  zoomControl: false // Remove default zoom control to add custom styled one
}).setView([47.7998, 13.0453], 14); // Centered on Salzburg Altstadt

// Define color variables to match CSS variables
const COLORS = {
  MAIN: '#282828',     // Dark gray
  TEXT: '#ffffff',     // White text
  ACCENT: '#8CFFDA',   // Teal accent color
  SECONDARY: '#555555', // Secondary gray
  BG_DARK: '#0b0b0b'   // Background dark
};

var baseMap5 = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
});

baseMap5.addTo(map); // Dark Theme

// Add custom positioned zoom control
L.control.zoom({
  position: 'topleft'
}).addTo(map);

const cafeCircleStyle = {
  radius: 8,
  fillColor: COLORS.TEXT,
  color: COLORS.SECONDARY,
  weight: 0,
  opacity: 1,
  fillOpacity: 1
};

const favCafeCircleStyle = {
  radius: 8,
  fillColor: COLORS.ACCENT,
  color: COLORS.ACCENT,
  weight: 0,
  opacity: 1,
  fillOpacity: 1
};

// Load the all-fav.geojson and favcafes.geojson files with circle markers
loadGeoJSON('export.geojson', cafeCircleStyle);

// Function to handle popups for features
function onEachFeature(feature, layer) {
  if (feature.properties && feature.properties.name) {
    // Create simple hover label that only shows the name
    const hoverLabel = L.tooltip({
      permanent: false,
      direction: 'top',
      className: 'hover-tooltip'
    }).setContent(`<div>${feature.properties.name || 'Restaurant'}</div>`);
    
    // Bind the tooltip for hover effect
    layer.bindTooltip(hoverLabel);
    
    // Create a custom popup with detailed content for click
    const popupContent = createPopupContent(feature.properties);
    
    // Bind the popup to the layer with options to center it on the marker
    const popup = L.popup({
      className: 'custom-popup',
      maxWidth: 300,
      closeButton: true,
      offset: [0, -10], // Slight offset to ensure it doesn't cover the marker
      autoPan: true,    // Ensure popup is in view
      autoClose: false  // Keep popup open until explicitly closed
    }).setContent(popupContent);
    
    // Custom binding to control popup behavior
    layer.bindPopup(popup);
    
    // Add hover and click behaviors with tooltip management
    layer.on({
      mouseover: function(e) {
        // Only show tooltip if popup is not open
        if (!this._popup || !this._popup._isOpen) {
          this.openTooltip();
        }
      },
      mouseout: function(e) {
        this.closeTooltip();
      },
      popupopen: function(e) {
        // Close tooltip when popup opens
        this.closeTooltip();
        
        // Prevent tooltip from showing while popup is open
        this.off('mouseover');
        
        // Handle popup close event to restore tooltip behavior
        this.once('popupclose', function() {
          // Restore mouseover handler after popup closes
          this.on('mouseover', function() {
            this.openTooltip();
          });
        });
      },
      click: function(e) {
        // Open popup centered on marker rather than at click point
        const latlng = this.getLatLng();
        this.openPopup(latlng);
        
        // Prevent event propagation to avoid map click handlers
        L.DomEvent.stopPropagation(e);
      }
    });
  }
}

// Function to create formatted popup content
function createPopupContent(properties) {
  // Create container for popup content
  let content = '<div class="popup-container">';
  
  // Restaurant name
  content += `<div class="popup-name">${properties.name || 'Restaurant'}</div>`;
  
  // Opening hours if available
  if (properties.opening_hours) {
    content += `<div class="popup-hours">
                  <span class="popup-label">Hours:</span> 
                  <span class="popup-value">${properties.opening_hours}</span>
                </div>`;
  }
  
  // Cuisine if available
  if (properties.cuisine) {
    content += `<div class="popup-cuisine">
                  <span class="popup-label">Cuisine:</span> 
                  <span class="popup-value">${properties.cuisine}</span>
                </div>`;
  }
  
  // Phone if available
  if (properties.phone) {
    content += `<div class="popup-phone">
                  <span class="popup-label">Phone:</span> 
                  <span class="popup-value">${properties.phone}</span>
                </div>`;
  }
  
  // Website button if available
  if (properties.website) {
    content += `<div class="popup-website">
                  <a href="${properties.website}" target="_blank" class="website-btn">Visit Website</a>
                </div>`;
  }
  
  content += '</div>';
  return content;
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

// Function to calculate the centroid of a polygon or multipolygon
function calculateCentroid(geometry) {
  try {
    // For Point geometries, just return the coordinates
    if (geometry.type === 'Point') {
      return [geometry.coordinates[1], geometry.coordinates[0]]; // [lat, lng] for Leaflet
    }
    
    // For Polygon geometries
    if (geometry.type === 'Polygon') {
      const coordinates = geometry.coordinates[0]; // Outer ring
      let lat = 0, lng = 0;
      
      // Calculate average of all points
      for (const coord of coordinates) {
        lng += coord[0];
        lat += coord[1];
      }
      
      return [lat / coordinates.length, lng / coordinates.length];
    }
    
    // For MultiPolygon geometries
    if (geometry.type === 'MultiPolygon') {
      // Use the first polygon for simplicity
      const coordinates = geometry.coordinates[0][0]; // First polygon, outer ring
      let lat = 0, lng = 0;
      
      for (const coord of coordinates) {
        lng += coord[0];
        lat += coord[1];
      }
      
      return [lat / coordinates.length, lng / coordinates.length];
    }
    
    console.warn('Unsupported geometry type:', geometry.type);
    return null;
  } catch (error) {
    console.error('Error calculating centroid:', error);
    return null;
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
      
      // Create a normalized version of the GeoJSON where all features are points
      const normalizedData = {
        type: 'FeatureCollection',
        features: []
      };
      
      // Convert all geometries to points (using centroids for polygons)
      data.features.forEach(feature => {
        // Skip features without geometry
        if (!feature.geometry) return;
        
        // For non-point geometries, calculate the centroid
        if (feature.geometry.type !== 'Point') {
          const centroid = calculateCentroid(feature.geometry);
          
          if (centroid) {
            // Create a new point feature at the centroid location
            normalizedData.features.push({
              type: 'Feature',
              properties: feature.properties,
              geometry: {
                type: 'Point',
                coordinates: [centroid[1], centroid[0]] // [lng, lat] for GeoJSON
              }
            });
          }
        } else {
          // If it's already a point, just add it directly
          normalizedData.features.push(feature);
        }
      });
      
      // Create a GeoJSON layer with circle markers
      var geoJsonLayer = L.geoJSON(normalizedData, {
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
  imperial: false,
  position: 'bottomleft'
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
    div.style.fontFamily = "'Noto Sans KR', sans-serif";
    div.style.color = COLORS.TEXT;
    div.style.zIndex = '1000';
    div.innerHTML = `
      <h4 style="margin: 0; font-size: 12pt; color: ${COLORS.TEXT};">Legend</h4>
      <div style="display: flex; align-items: center; margin-top: 8px;">
        <span style="
          display: inline-block;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: ${COLORS.TEXT};
          border: 1px solid ${COLORS.SECONDARY};
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
          background-color: ${COLORS.ACCENT};
          border: 1px solid ${COLORS.ACCENT};
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
