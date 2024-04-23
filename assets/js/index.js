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

const tagToColor = {
    's': '#84cc16',  // start
    'e': '#b91c1c',    // finish
    'f': '#fda4af',  // foot
    '': 'blue'    // any
};


function selectPolygonsFromURL() {
    var queryParams = new URLSearchParams(window.location.search);
    var selectedIndices = queryParams.get('selected');
    if (selectedIndices) {
        selectedIndices.split(',').forEach(function (taggedIndex) {
            // Separate the index from the tag
            var parts = taggedIndex.split('_');
            var index = parseInt(parts[0], 10);
            var tag = parts[1];

            var layer = polygonLayers[index];
            if (layer) {
                map.addLayer(layer);
                var color = tagToColor[tag] || 'blue'; // Default to blue if no tag is present
                layer.setStyle({color: color});
                selectedPolygonIndices.push(taggedIndex); // Update the global selected indices array
            }
        });
    }
}


function updateUrlWithSelectedPolygons() {
    var selectedParams = selectedPolygonIndices.length > 0 ? 'selected=' + selectedPolygonIndices.join(',') : '';
    var newUrl = window.location.pathname + (selectedParams ? '?' + selectedParams : '');
    window.history.pushState({path: newUrl}, '', newUrl);
}


map.on('click', function (e) {
    var clickedPoint = e.latlng;
    var minArea = Infinity;
    var minAreaLayer = null;
    var clickedLayers = [];

    // Identify all polygons that contain the clicked point and find the one with the smallest area
    polygonLayers.forEach(function (layer) {
        if (isPointInPolygon(clickedPoint, layer)) {
            clickedLayers.push(layer); // Track polygons that the point is inside
            var polyArea = turf.area(layer.toGeoJSON());
            if (polyArea < minArea) {
                minArea = polyArea;
                minAreaLayer = layer;
            }
        }
    });

    if (!map.hasLayer(minAreaLayer)) {
        map.addLayer(minAreaLayer);
        selectedPolygonIndices.push(polygonLayers.indexOf(minAreaLayer)); // Update selected indices
    } else if (map.hasLayer(minAreaLayer) && clickedLayers.includes(minAreaLayer)) {
        map.removeLayer(minAreaLayer);
        // Update the list of selected indices
        selectedPolygonIndices = selectedPolygonIndices.filter(taggedIndex => {
            return getNumericIndex(taggedIndex) !== polygonLayers.indexOf(minAreaLayer);
        });
    }

    updateUrlWithSelectedPolygons(); // Update the URL if necessary
});

function getNumericIndex(taggedIndex) {
    // Check if the index is already a number
    if (typeof taggedIndex === 'number') {
        return taggedIndex;  // Return as is if it's a number
    }
    // Otherwise, assume it's a string and parse the numeric part
    return parseInt(taggedIndex.split('_')[0], 10);
}


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
                var layer = polygonLayers[getNumericIndex(index)];
                if (layer) {
                    map.addLayer(layer);
                    selectedPolygonIndices.push(index);
                }
            });
            updateUrlWithSelectedPolygons();
            loadPolygonsAndSelectFromURL();
        };
        reader.readAsText(file);
    }
});
document.getElementById('save').addEventListener('click', savePolygons);
// document.getElementById('undo').addEventListener('click', undoLastAction);
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
    selectedPolygonIndices = [];
    undoStack = [];
    polygonLayers = [];
    // clear the map
    map.eachLayer(function (layer) {
        if (layer instanceof L.Polygon) {
            map.removeLayer(layer);
        }
    })
    updateUrlWithSelectedPolygons();
    loadPolygonsAndSelectFromURL();
}

$(document).ready(function () {
    // Initialize your map and other settings

    // Then load the polygons and apply selections from the URL
    loadPolygonsAndSelectFromURL();
});

document.getElementById('start').addEventListener('click', function () {
    changePolygonColor('_s');
});

document.getElementById('finish').addEventListener('click', function () {
    changePolygonColor('_e');
});

document.getElementById('foot').addEventListener('click', function () {
    changePolygonColor('_f');
});

document.getElementById('any').addEventListener('click', function () {
    changePolygonColor('');
});


function changePolygonColor(tag) {
    var color = tagToColor[tag.split('_')[1]] || 'blue';
    console.log("Changing color to: " + color);
    console.log(selectedPolygonIndices);
    // get indicies from url

    if (selectedPolygonIndices.length > 0) {
        var lastIndex = selectedPolygonIndices[selectedPolygonIndices.length - 1];
        // check if lastIndex is a string then split it
        if (typeof lastIndex === 'string') {
            lastIndex = lastIndex.split('_')[0];
        }
        console.log(lastIndex);
        var lastPolygon = polygonLayers[lastIndex];
        if (lastPolygon) {
            lastPolygon.setStyle({color: color});

            // Append the tag to the index in the array
            var taggedIndex = lastIndex + tag;

            // Update the last element in the array to include the tag
            selectedPolygonIndices[selectedPolygonIndices.length - 1] = taggedIndex;

            // Update the URL to reflect this change
            updateUrlWithSelectedPolygons();
        }
    } else {
        alert("No polygon selected to color.");
    }
}

