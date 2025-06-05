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
  position: 'bottomleft'
}).addTo(map);

// Add a title to the map
const mapTitle = L.DomUtil.create('div', 'map-title');
mapTitle.innerHTML = 'Vegan friendly restaurants in Austria';
document.body.appendChild(mapTitle);

// Add fade-in animation for the title
setTimeout(() => {
  mapTitle.style.opacity = '1';
}, 500);

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

// Create a variable to store the current GeoJSON layer
let currentGeoJsonLayer = null;

// Variable to store country/region data, will be populated dynamically
let countryData = {};

// Function to load available GeoJSON files and populate the countryData object
function loadAvailableGeoJsonFiles() {
  // Default country data with manually defined bounds
  // This will be extended with any additional GeoJSON files found
  const defaultBounds = {
    'austria': [[46.3723, 9.5307], [49.0205, 17.1608]], // SW and NE corners of Austria
    'japan': [[30.9787, 129.4966], [45.5231, 145.8435]] // SW and NE corners of Japan
    // Add more default bounds for known regions as needed
  };
  
  // Fetch the list of available GeoJSON files from the data directory
  fetch('data/')
    .then(response => response.text())
    .then(html => {
      // Parse the directory listing
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = Array.from(doc.querySelectorAll('a'));
      
      // Filter for GeoJSON files only
      const geojsonLinks = links.filter(link => {
        const href = link.getAttribute('href');
        return href && href.endsWith('.geojson');
      });
      
      // Process each GeoJSON file
      geojsonLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Extract the region name from the filename (remove .geojson extension)
        const region = href.replace('.geojson', '');
        
        // Create a title from the region name (capitalize first letter of each word)
        const title = region
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Add the region to countryData, with the file path and title
        countryData[region] = {
          file: `data/${href}`,
          title: `Vegan friendly restaurants in ${title}`,
          bounds: defaultBounds[region] || null // Use default bounds if available
        };
      });
      
      // Alternative method: If no links were found, scan for filenames in the HTML
      if (geojsonLinks.length === 0) {
        // Try to find filenames directly in the text
        const regex = /[a-z0-9_-]+\.geojson/gi;
        const matches = html.match(regex) || [];
        
        matches.forEach(filename => {
          const region = filename.replace('.geojson', '');
          const title = region
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          countryData[region] = {
            file: `data/${filename}`,
            title: `Vegan friendly restaurants in ${title}`,
            bounds: defaultBounds[region] || null
          };
        });
      }
      
      // If still no GeoJSON files were found, use the fallback data
      if (Object.keys(countryData).length === 0) {
        console.warn('No GeoJSON files found, using fallback data');
        countryData = {
          austria: {
            file: 'data/austria.geojson',
            title: 'Vegan friendly restaurants in Austria',
            bounds: defaultBounds['austria']
          },
          japan: {
            file: 'data/japan.geojson',
            title: 'Vegan friendly restaurants in Japan',
            bounds: defaultBounds['japan']
          }
        };
      }
      
      // Update the country selector with the available regions
      updateCountrySelector();
      
      // Load the first region by default
      const firstRegion = Object.keys(countryData)[0];
      loadCountryData(firstRegion);
    })
    .catch(error => {
      console.error('Error loading GeoJSON file list:', error);
      
      // Fallback to static data in case of error
      countryData = {
        austria: {
          file: 'data/austria.geojson',
          title: 'Vegan friendly restaurants in Austria',
          bounds: defaultBounds['austria']
        },
        japan: {
          file: 'data/japan.geojson',
          title: 'Vegan friendly restaurants in Japan',
          bounds: defaultBounds['japan']
        }
      };
      
      // Update the country selector with the fallback data
      updateCountrySelector();
      
      // Load Austria data by default
      loadCountryData('austria');
    });
}

// Function to update the country selector with the available regions
function updateCountrySelector() {
  const selectorContainer = document.querySelector('.selector-container');
  if (!selectorContainer) return;
  
  // Clear the existing selector
  selectorContainer.innerHTML = '';
  
  // Get all available regions from countryData
  const regions = Object.keys(countryData);
  
  // Create a radio button for each region
  regions.forEach((region, index) => {
    // Format the region name for display (capitalize first letter of each word)
    const displayName = region
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Create the radio button element
    const radioBtn = document.createElement('label');
    radioBtn.className = 'country-option';
    radioBtn.innerHTML = `
      <input type="radio" name="country" value="${region}" ${index === 0 ? 'checked' : ''}>
      <span class="country-label">${displayName}</span>
    `;
    
    // Add event listener for radio button change
    const input = radioBtn.querySelector('input');
    input.addEventListener('change', function() {
      if (this.checked) {
        loadCountryData(this.value);
      }
    });
    
    // Add the radio button to the selector
    selectorContainer.appendChild(radioBtn);
  });
}

// Function to handle popups for features
function onEachFeature(feature, layer) {
  if (feature.properties) {
    // Get the restaurant name (prefer English name if available)
    const restaurantName = feature.properties['name:en'] || feature.properties.name || 'Restaurant';
    
    // Create tooltip with name and address if available
    let tooltipContent = `<div style="text-align: center; font-weight: 500;">${restaurantName}`;
    
    // Add address if available
    if (feature.properties.addr_street || feature.properties.addr_housenumber) {
      const address = [
        feature.properties.addr_housenumber,
        feature.properties.addr_street
      ].filter(Boolean).join(' ');
      
      if (address.trim() !== '') {
        tooltipContent += `<div style="font-size: 12px; font-weight: 400; opacity: 0.8;">${address}</div>`;
      }
    }
    
    tooltipContent += `</div>`;
    
    const hoverLabel = L.tooltip({
      permanent: false,
      direction: 'top',
      className: 'hover-tooltip',
      offset: [0, -12] // Offset upward to avoid overlapping with the marker
    }).setContent(tooltipContent);
    
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
            // Only show tooltip if popup is not open
            if (!this._popup || !this._popup._isOpen) {
              this.openTooltip();
            }
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
  
  // Restaurant name (prefer English name if available)
  const restaurantName = properties['name:en'] || properties.name || 'Restaurant';
  content += `<div class="popup-name">${restaurantName}</div>`;
  
  // Opening hours if available
  if (properties.opening_hours) {
    content += `<div class="popup-hours">
                  <span class="popup-label">Hours:</span> 
                  <span class="popup-value">${properties.opening_hours}</span>
                </div>`;
  }
    // Cuisine if available
  if (properties.cuisine) {
    // Format cuisine: replace semicolons with commas, underscores with spaces, and capitalize each word
    const formattedCuisine = properties.cuisine
      .split(';')
      .map(item => {
        // Replace underscores with spaces and capitalize each word
        return item.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      })
      .join(', ');
    
    content += `<div class="popup-cuisine">
                  <span class="popup-label">Cuisine:</span> 
                  <span class="popup-value">${formattedCuisine}</span>
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

// Function to load and display GeoJSON data for a specific country
function loadCountryData(country) {
  // Update the map title
  mapTitle.innerHTML = countryData[country].title;
  
  // Clear existing layer if it exists
  if (currentGeoJsonLayer) {
    map.removeLayer(currentGeoJsonLayer);
  }
  
  // Check if we have predefined bounds for this country
  if (countryData[country].bounds) {
    // Use predefined bounds
    map.fitBounds(countryData[country].bounds);
    
    // Load the GeoJSON for the selected country
    loadGeoJSON(countryData[country].file, cafeCircleStyle);
  } else {
    // No predefined bounds, need to calculate them from the GeoJSON data
    fetch(countryData[country].file)
      .then(response => response.json())
      .then(data => {
        // Calculate bounds from the features in the GeoJSON
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        
        // Process each feature to find the bounding box
        data.features.forEach(feature => {
          if (!feature.geometry) return;
          
          // Handle different geometry types
          if (feature.geometry.type === 'Point') {
            const [lng, lat] = feature.geometry.coordinates;
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          } else if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach(coord => {
              const [lng, lat] = coord;
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
            });
          } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(polygon => {
              polygon[0].forEach(coord => {
                const [lng, lat] = coord;
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
                minLng = Math.min(minLng, lng);
                maxLng = Math.max(maxLng, lng);
              });
            });
          }
        });
        
        // Store the calculated bounds for future use
        countryData[country].bounds = [
          [minLat, minLng], // SW corner
          [maxLat, maxLng]  // NE corner
        ];
        
        // Add some padding around the bounds (10%)
        const latPadding = (maxLat - minLat) * 0.1;
        const lngPadding = (maxLng - minLng) * 0.1;
        const paddedBounds = [
          [minLat - latPadding, minLng - lngPadding],
          [maxLat + latPadding, maxLng + lngPadding]
        ];
        
        // Fit map to the calculated bounds
        map.fitBounds(paddedBounds);
        
        // Load the GeoJSON data
        loadGeoJSON(countryData[country].file, cafeCircleStyle);
      })
      .catch(error => {
        console.error(`Error loading GeoJSON for ${country}:`, error);
        
        // Fallback to a default view if bounds calculation fails
        map.setView([0, 0], 2);
        loadGeoJSON(countryData[country].file, cafeCircleStyle);
      });
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
      
      // Store the current layer for later removal when switching countries
      currentGeoJsonLayer = geoJsonLayer;
      
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

// Add a metric scale bar at the bottom right
L.control.scale({
  metric: true,   
  imperial: false,
  position: 'bottomright'
}).addTo(map);

// Add a legend
function addLegend(map) {
  const legend = L.control({ position: 'bottomleft' });

  // Update legend to use circles instead of icons and remove border
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
      <h4 style="margin: 0 0 10px 0; font-size: 14pt; color: ${COLORS.TEXT};">Legend</h4>
      <div style="display: flex; align-items: center; margin-top: 8px;">
        <span style="
          display: inline-block;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: ${COLORS.TEXT};
          border: none;
          margin-right: 8px;
        "></span>
        <span style="font-size: 11pt;">Restaurant</span>
      </div>
    `;
    return div;
  };
  legend.addTo(map);
}

// Call the legend function
addLegend(map);

// Add the country selector control
function addCountrySelector(map) {
  const countrySelector = L.control({ position: 'bottomleft' });
  
  countrySelector.onAdd = function() {
    const div = L.DomUtil.create('div', 'country-selector');
    div.innerHTML = `
      <h4 style="margin: 0 0 10px 0; font-size: 14pt; color: ${COLORS.TEXT};">Region</h4>
      <div class="selector-container">
        <!-- Radio buttons will be dynamically added here -->
      </div>
    `;
    
    // Prevent click events from propagating to the map
    L.DomEvent.disableClickPropagation(div);
    
    return div;
  };
  
  countrySelector.addTo(map);
}

// Add the cuisine selector control
function addCuisineSelector(map) {
  const cuisineSelector = L.control({ position: 'bottomleft' });
  
  cuisineSelector.onAdd = function() {
    const div = L.DomUtil.create('div', 'cuisine-selector');
    div.innerHTML = `
      <h4 style="margin: 0 0 10px 0; font-size: 14pt; color: ${COLORS.TEXT};">Cuisine Filter</h4>
      <div class="cuisine-input-container">
        <input type="text" id="cuisine-input" placeholder="Type to filter cuisines...">
        <button id="clear-cuisine" title="Clear filter">×</button>
      </div>
      <div id="cuisine-suggestions" class="cuisine-suggestions"></div>
      <div id="cuisine-count" class="cuisine-count"></div>
    `;
    
    // Prevent click events from propagating to the map
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);
    
    return div;
  };
  
  cuisineSelector.addTo(map);
  
  // Initialize cuisine selector functionality after adding to map
  initCuisineSelector();
}

// Initialize cuisine selector functionality
function initCuisineSelector() {
  const input = document.getElementById('cuisine-input');
  const suggestionsContainer = document.getElementById('cuisine-suggestions');
  const clearButton = document.getElementById('clear-cuisine');
  const countDisplay = document.getElementById('cuisine-count');
  
  // Variable to store available cuisines from current data
  let availableCuisines = [];
  let currentFilter = null;
  let totalPoints = 0;
  
  // Function to extract cuisines from GeoJSON data
  function extractCuisinesFromData() {
    if (!currentGeoJsonLayer) return [];
    
    const cuisines = new Set();
    let count = 0;
    
    currentGeoJsonLayer.eachLayer(function(layer) {
      count++;
      if (layer.feature && layer.feature.properties && layer.feature.properties.cuisine) {
        // Split by semicolon since OSM data uses semicolons to separate multiple cuisines
        const cuisineList = layer.feature.properties.cuisine.split(';');
        
        cuisineList.forEach(cuisine => {
          // Format cuisine: replace underscores with spaces and capitalize
          const formattedCuisine = cuisine.trim()
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          if (formattedCuisine) {
            cuisines.add(formattedCuisine);
          }
        });
      }
    });
    
    // Update total point count
    totalPoints = count;
    
    // Update the count display to show total points
    updateCountDisplay(totalPoints, totalPoints);
    
    return Array.from(cuisines).sort();
  }
  
  // Function to update the count display
  function updateCountDisplay(filtered, total) {
    if (countDisplay) {
      countDisplay.textContent = `Showing ${filtered} of ${total} restaurants`;
      
      // Add a class when filtered to highlight the count
      if (filtered < total) {
        countDisplay.classList.add('filtered');
      } else {
        countDisplay.classList.remove('filtered');
      }
    }
  }
  
  // Function to show suggestions based on input
  function showSuggestions(inputValue) {
    // Clear previous suggestions
    suggestionsContainer.innerHTML = '';
    
    if (!inputValue) {
      suggestionsContainer.style.display = 'none';
      return;
    }
    
    // Filter cuisines that match the input (case insensitive)
    const filteredCuisines = availableCuisines.filter(cuisine => 
      cuisine.toLowerCase().includes(inputValue.toLowerCase())
    );
    
    if (filteredCuisines.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }
    
    // Create suggestion elements
    filteredCuisines.forEach(cuisine => {
      const suggestion = document.createElement('div');
      suggestion.className = 'cuisine-suggestion';
      suggestion.textContent = cuisine;
      
      // Add click event to select this cuisine
      suggestion.addEventListener('click', function() {
        input.value = cuisine;
        suggestionsContainer.style.display = 'none';
        currentFilter = cuisine;
        filterMapByCuisine(cuisine);
      });
      
      suggestionsContainer.appendChild(suggestion);
    });
    
    suggestionsContainer.style.display = 'block';
  }
  
  // Function to filter map points by cuisine
  function filterMapByCuisine(cuisine) {
    if (!currentGeoJsonLayer) return;
    
    let matchCount = 0;
    
    currentGeoJsonLayer.eachLayer(function(layer) {
      if (layer.feature && layer.feature.properties) {
        const properties = layer.feature.properties;
        
        if (properties.cuisine) {
          // Format cuisine from properties in the same way we did for the list
          const formattedCuisines = properties.cuisine.split(';').map(c => 
            c.trim().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
          );
          
          // Check if the layer's cuisines include the filter cuisine
          const match = formattedCuisines.some(c => c === cuisine);
          
          if (match) {
            // Show the layer and restore its style
            layer.setStyle({
              opacity: 1,
              fillOpacity: 1
            });
            matchCount++;
          } else {
            // Hide the layer by making it nearly transparent
            layer.setStyle({
              opacity: 0.15,
              fillOpacity: 0.15
            });
          }
        } else {
          // No cuisine property, hide it
          layer.setStyle({
            opacity: 0.15,
            fillOpacity: 0.15
          });
        }
      }
    });
    
    // Update the count display
    updateCountDisplay(matchCount, totalPoints);
  }
  
  // Function to clear the cuisine filter
  function clearCuisineFilter() {
    input.value = '';
    currentFilter = null;
    suggestionsContainer.style.display = 'none';
    
    // Reset all layers to visible
    if (currentGeoJsonLayer) {
      currentGeoJsonLayer.eachLayer(function(layer) {
        layer.setStyle({
          opacity: 1,
          fillOpacity: 1
        });
      });
    }
    
    // Reset count display
    updateCountDisplay(totalPoints, totalPoints);
  }
  
  // Event listener for input field
  input.addEventListener('input', function() {
    showSuggestions(this.value);
  });
  
  // Event listener for clear button
  clearButton.addEventListener('click', clearCuisineFilter);
  
  // Close suggestions when clicking outside
  document.addEventListener('click', function(e) {
    if (!suggestionsContainer.contains(e.target) && e.target !== input) {
      suggestionsContainer.style.display = 'none';
    }
  });
  
  // Update available cuisines when data changes
  function updateAvailableCuisines() {
    availableCuisines = extractCuisinesFromData();
    
    // If there's a current filter, reapply it to the new data
    if (currentFilter) {
      filterMapByCuisine(currentFilter);
    }
  }
  
  // Expose the update function to the global scope so it can be called from elsewhere
  window.updateCuisineList = updateAvailableCuisines;
}

// Add the country selector
addCountrySelector(map);

// Add the cuisine selector
addCuisineSelector(map);

// Modify loadCountryData to update cuisines after loading data
const originalLoadCountryData = loadCountryData;
loadCountryData = function(country) {
  originalLoadCountryData(country);
  // After a small delay to ensure data is loaded
  setTimeout(() => {
    if (window.updateCuisineList) {
      window.updateCuisineList();
    }
  }, 500);
};

// Load available GeoJSON files and initialize the map
loadAvailableGeoJsonFiles();

// Trigger map resize when the window resizes
window.addEventListener('resize', function () {
  map.invalidateSize();
});
