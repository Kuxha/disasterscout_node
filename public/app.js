const map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const icons = {
    SOS: L.divIcon({ html: '🔴', className: 'marker-icon', iconSize: [20, 20] }),
    SHELTER: L.divIcon({ html: '🏠', className: 'marker-icon', iconSize: [20, 20] }),
    INFO: L.divIcon({ html: 'ℹ️', className: 'marker-icon', iconSize: [20, 20] }),
    OTHER: L.divIcon({ html: '📍', className: 'marker-icon', iconSize: [20, 20] })
};

// Region coordinates for quick jumping
const regions = {
    "California": [36.7783, -119.4179],
    "New York": [40.7128, -74.0060],
    "Japan": [36.2048, 138.2529],
    "Florida": [27.6648, -81.5158],
    "Texas": [31.9686, -99.9018]
};

async function loadIncidents() {
    try {
        const res = await fetch('/api/incidents');
        const incidents = await res.json();

        // Clear existing markers if we were tracking them, 
        // but for simplicity we'll just add new ones or rely on map refresh.
        // A better way is to clear a layer group.

        incidents.forEach(inc => {
            if (inc.location && inc.location.coordinates) {
                const [lon, lat] = inc.location.coordinates;
                const icon = icons[inc.category] || icons.OTHER;

                L.marker([lat, lon], { icon })
                    .addTo(map)
                    .bindPopup(`
                        <b>${inc.category}</b><br>
                        ${inc.description}<br>
                        <a href="${inc.url}" target="_blank">Source</a>
                    `);
            }
        });
    } catch (err) {
        console.error("Failed to load incidents", err);
    }
}

// UI Event Listeners
document.getElementById('regionSelect').addEventListener('change', (e) => {
    const region = e.target.value;
    if (regions[region]) {
        map.setView(regions[region], 6);
    }
});

document.getElementById('locateBtn').addEventListener('click', () => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 10);
            L.marker([latitude, longitude], {
                icon: L.divIcon({ html: '🔵', className: 'user-icon', iconSize: [20, 20] })
            }).addTo(map).bindPopup("You are here").openPopup();
        });
    } else {
        alert("Geolocation is not supported by your browser");
    }
});

document.getElementById('scanBtn').addEventListener('click', async () => {
    const region = document.getElementById('regionSelect').value;
    const topic = document.getElementById('topicInput').value;
    const btn = document.getElementById('scanBtn');

    if (!region) {
        alert("Please select a region first");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Scanning...";

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region, topic })
        });
        const data = await res.json();

        alert(data.message || "Scan complete");
        loadIncidents(); // Refresh map
    } catch (err) {
        console.error(err);
        alert("Scan failed");
    } finally {
        btn.disabled = false;
        btn.textContent = "Scan Region";
    }
});

// Initial load
loadIncidents();
