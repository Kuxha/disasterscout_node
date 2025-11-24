// Initialize map
const map = L.map('map').setView([20, 0], 2); // World view initially

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);

// Icons
const createIcon = (color) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -10]
    });
};

const icons = {
    SOS: createIcon('#dc3545'),
    SHELTER: createIcon('#28a745'),
    INFO: createIcon('#17a2b8'),
    OTHER: createIcon('#6c757d')
};

// Elements
const regionSelect = document.getElementById('regionSelect');
const loadRegionBtn = document.getElementById('loadRegionBtn');
const nearMeBtn = document.getElementById('nearMeBtn');
const radiusInput = document.getElementById('radiusInput');
const statusDiv = document.getElementById('status');

// Check URL params
const urlParams = new URLSearchParams(window.location.search);
const regionParam = urlParams.get('region');
if (regionParam) {
    loadIncidents(regionParam);
    // If it matches an option, select it
    for (let i = 0; i < regionSelect.options.length; i++) {
        if (regionSelect.options[i].value === regionParam) {
            regionSelect.selectedIndex = i;
            break;
        }
    }
}

loadRegionBtn.addEventListener('click', () => {
    const region = regionSelect.value;
    if (region) {
        loadIncidents(region);
    }
});

nearMeBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        statusDiv.textContent = "Locating...";
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const radius = radiusInput.value || 10;
            loadNearby(lat, lon, radius);
        }, error => {
            statusDiv.textContent = "Geolocation failed: " + error.message;
        });
    } else {
        statusDiv.textContent = "Geolocation not supported";
    }
});

async function loadIncidents(region) {
    statusDiv.textContent = `Loading incidents for ${region}...`;
    try {
        const res = await fetch(`/api/incidents?region=${encodeURIComponent(region)}`);
        const data = await res.json();
        renderIncidents(data);
        statusDiv.textContent = `Loaded ${data.features.length} incidents.`;
    } catch (e) {
        console.error(e);
        statusDiv.textContent = "Error loading incidents.";
    }
}

async function loadNearby(lat, lon, radius) {
    statusDiv.textContent = `Finding incidents within ${radius}km...`;
    try {
        const res = await fetch(`/api/incidents_near?lat=${lat}&lon=${lon}&radius_km=${radius}`);
        const data = await res.json();
        renderIncidents(data);
        statusDiv.textContent = `Found ${data.features.length} incidents near you.`;

        // Center map on user
        map.setView([lat, lon], 12);
        // Add user marker
        L.marker([lat, lon]).addTo(markersLayer).bindPopup("You are here").openPopup();

    } catch (e) {
        console.error(e);
        statusDiv.textContent = "Error loading nearby incidents.";
    }
}

function renderIncidents(geojson) {
    markersLayer.clearLayers();

    if (!geojson.features || geojson.features.length === 0) {
        return;
    }

    const bounds = L.latLngBounds();

    L.geoJSON(geojson, {
        pointToLayer: (feature, latlng) => {
            const cat = feature.properties.category || 'OTHER';
            return L.marker(latlng, { icon: icons[cat] || icons.OTHER });
        },
        onEachFeature: (feature, layer) => {
            const p = feature.properties;
            const popupContent = `
                <div class="popup-content">
                    <h3>${p.title || 'Incident'}</h3>
                    <span class="category cat-${p.category}">${p.category}</span>
                    <p>${p.description || ''}</p>
                    <p><strong>Location:</strong> ${p.locationName}</p>
                    ${p.url ? `<a href="${p.url}" target="_blank">Source Link</a>` : ''}
                </div>
            `;
            layer.bindPopup(popupContent);
            bounds.extend(layer.getLatLng());
        }
    }).addTo(markersLayer);

    if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}
