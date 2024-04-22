var map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -5,
    maxZoom: 3,
    center: [1536, 1732],
    zoom: -1,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 120
});

// Array to keep track of selected polygon indices
var selectedPolygonIndices = [];
// Stack to keep track of selection history for the undo feature
var undoStack = [];

var polygonLayers = [];
var bounds = [[0, 0], [3072, 3464]];
var image = L.imageOverlay('assets/images/spray.jpg', bounds).addTo(map);

map.fitBounds(bounds);

function loadPolygonsAndSelectFromURL() {
    fetch('assets/polygons/polys.json')
        .then(function (response) {
            return response.json();
        })
        .then(function (polygons) {
            // Create Leaflet polygon layers and store them in the global array
            polygonLayers = polygons.map(function (polygonCoords, index) {
                return L.polygon(polygonCoords, {color: 'blue'});
            });

            // Now that polygons are loaded, select the ones from the URL, if any
            selectPolygonsFromURL();
        })
        .catch(function (error) {
            console.error('Error loading the polygon data:', error);
        });
}

function selectPolygonsFromURL() {
    var queryParams = new URLSearchParams(window.location.search);
    var selectedIndices = queryParams.get('selected');
    if (selectedIndices) {
        selectedPolygonIndices = selectedIndices.split(',').map(Number);
        // Use these indices to select the corresponding polygons
        selectedPolygonIndices.forEach(function (index) {
            if (polygonLayers[index]) {
                map.addLayer(polygonLayers[index]);
            }
        });
    }
}


function updateUrlWithSelectedPolygons() {
    var selectedParams = 'selected=' + selectedPolygonIndices.join(',');
    var newUrl = window.location.pathname + '?' + selectedParams;
    window.history.pushState({path: newUrl}, '', newUrl);
}


map.on('click', function (e) {
    polygonLayers.forEach(function (layer, index) {
        if (isPointInPolygon(e.latlng, layer)) {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
                selectedPolygonIndices = selectedPolygonIndices.filter(function (i) {
                    return i !== index;
                });
            } else {
                map.addLayer(layer);
                selectedPolygonIndices.push(index);
                undoStack.push(index); // Add index to the undo stack
            }
        }
    });
    updateUrlWithSelectedPolygons();
});

// Helper function to check if a point is inside a polygon
function isPointInPolygon(point, polygonLayer) {
    var poly = polygonLayer.toGeoJSON();
    var pt = turf.point([point.lng, point.lat]);
    return turf.booleanPointInPolygon(pt, poly);
}


// Bind button click events
document.getElementById('load').addEventListener('click', function () {
    document.getElementById('fileInput').click(); // Simulate click on the file
    input
    field
});


// Read the file once the user has selected it
document.getElementById('fileInput').addEventListener('change', function (event) {
    var file = event.target.files[0]; // Get the selected file
    if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var indices;
            try {
                indices = JSON.parse(e.target.result);
            } catch (err) {
                alert('Error parsing JSON. Please select a valid JSON file.');
                return;
            }
// Assuming the rest of the load logic is correct
            clearAll(); // Clear current selections
            indices.forEach(function (index) {
                var layer = polygonLayers[index];
                if (layer) {
                    map.addLayer(layer);
                    selectedPolygonIndices.push(index);
                }
            });
            updateUrlWithSelectedPolygons();
        };
        reader.readAsText(file);
    }
});
document.getElementById('save').addEventListener('click', savePolygons);
document.getElementById('undo').addEventListener('click', undoLastAction);
document.getElementById('clear').addEventListener('click', clearAll);


// Function to handle saving polygons
function savePolygons() {
    // Save the selectedPolygonIndices to a JSON file
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedPolygonIndices));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "myroute.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    updateUrlWithSelectedPolygons();
}

// Function to handle undo
function undoLastAction() {
    if (undoStack.length > 0) {
        var lastIndex = undoStack.pop();
        var lastLayer = polygonLayers[lastIndex];
        map.removeLayer(lastLayer);
        // Remove from the selected indices
        selectedPolygonIndices = selectedPolygonIndices.filter(function (index) {
            return index !== lastIndex;
        });
        updateUrlWithSelectedPolygons();
    }
}

// Function to clear all selections
function clearAll() {
    selectedPolygonIndices.forEach(function (index) {
        var layer = polygonLayers[index];
        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    });
    selectedPolygonIndices = [];
    undoStack = [];
    updateUrlWithSelectedPolygons();
}

$(document).ready(function () {
    // Initialize your map and other settings

    // Then load the polygons and apply selections from the URL
    loadPolygonsAndSelectFromURL();
});