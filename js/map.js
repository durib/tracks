function onLocationFound(e) {
    var radius = e.accuracy / 2;

    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();

    L.circle(e.latlng, radius).addTo(map);
}

function onError(e) {
    alert(e.message);
}

// BASEMAPS
var listBasemapUrl = 'https://services.thelist.tas.gov.au/arcgis/rest/services/Basemaps/{id}/MapServer/tile/{z}/{y}/{x}'; 
var listWMSUrl = 'http://services.thelist.tas.gov.au/arcgis/services/Public/{id}/MapServer/WMSServer?';
var cc = 'Map data <img class="cc" src="https://mirrors.creativecommons.org/presskit/buttons/80x15/png/by-nc-nd.png" alt="CC BY-NC-ND"> the LIST &copy; State of Tasmania';

var topo = L.tileLayer(listBasemapUrl, {
    id: 'Topographic',
    attribution: cc,
    maxNativeZoom:18,
    maxZoom:20
});

var ortho = L.tileLayer(listBasemapUrl, {
    id: 'Orthophoto',
    attribution: cc,
    maxNativeZoom:18,
    maxZoom:20
});

var baseMaps = {
    "Topographic": topo,
    "Orthophoto": ortho
};

// WMS LAYERS
var cadParcels = L.tileLayer.wms(listWMSUrl, {
    id: 'CadastreParcels',
    layers: '0',
    format: 'image/png',
    transparent: true,
    attribution: cc,
    maxZoom:20
});

var contour = L.tileLayer.wms(listWMSUrl, {
    id: 'TopographyAndRelief',
    layers: '38',
    format: 'image/png',
    transparent: true,
    attribution: cc,
    maxZoom:20
});

var tenure = L.tileLayer.wms(listWMSUrl, {
    id: 'CadastreAndAdministrative',
    layers: '47',
    format: 'image/png',
    transparent: true,
    attribution: cc,
    maxZoom:20,
    opacity:0.5
});

// VECTOR STYLES
var trackStyle = {
    "color": "#ff0000",
    "weight": 3
};

// VECTOR LAYERS
var tracks = L.geoJSON(null,{
    attribution: cc,
    style: function(feature) {
        return trackStyle;
    }
});

var overlays = {
    "Tracks": tracks,
    "5m contour": contour,
    "Parcels": cadParcels,
	"Land Tenure": tenure
};

// load vecor data
$.getJSON('./data/tracks.geojson').done(function(data) {
    tracks.addData(data.features);
});

// MAP & CONTROLS
var map = L.map('mapid',{
    center: [-42.875, 147.28],
    zoom:15,
    layers: [ortho,tracks],
});

L.control.layers(baseMaps, overlays).addTo(map);
L.control.locate().addTo(map);