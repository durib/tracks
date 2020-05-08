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

// VECTOR LAYERS
var tracks = L.geoJSON(null,{
    attribution: cc,
    style: {
        "color": "#ff0000",
        "weight": 3
    },
    onEachFeature: function (feature, layer) {
        popupOptions = {};
        layer.bindPopup("<b>Track Number:</b> " + feature.properties.track_id +
            "<br><b>Start Time:</b> " + feature.properties.start_time +
            "<br><b>End Time: </b>" + feature.properties.end_time
            ,popupOptions);
    }
});

// load vecor data
$.getJSON('./data/tracks.geojson').done(function(data) {
    tracks.addData(data.features);
});

var overlays = {
    "Tracks": tracks,
    "5m contour": contour,
    "Parcels": cadParcels,
	"Land Tenure": tenure
};

// MAP & CONTROLS
var map = L.map('mapid',{
    center: [-42.875, 147.28],
    zoom:15,
    layers: [ortho,tracks],
});

L.control.layers(baseMaps, overlays).addTo(map);
L.control.locate().addTo(map);

// Geolocation found
function onLocationFound(e) {
    let radius = e.accuracy / 2;

    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();

    L.circle(e.latlng, radius).addTo(map);
}

// CHART
addChart({x:0,y:0});

// show chart on layer click
map.on('popupopen', function(e){
    let x = document;
    let data = geomToDistance(e.popup._source.feature.geometry);

    addChart(data.xy);
    
    document.querySelector('#totaldistance').innerHTML = data.totaldistance;
    document.querySelector('#totalclimb').innerHTML = Math.round(data.climb)+"m";
    document.querySelector('#totalfall').innerHTML =  Math.round(data.fall)+"m";
});

// calculate distance-elevation object from geometry
function geomToDistance(geom){
    let coords = geom.coordinates;
    let td = 0;
    let sd = 0;
    let c = 0;
    let f = 0;
    let d = [];

    for (i = 0; i < coords.length-1; i++) {
        let deltax = coords[i][0] - coords[i+1][0];
        let deltay = coords[i][1] - coords[i+1][1];
        let distance = Math.sqrt(deltax*deltax + deltay*deltay);
        sd = sd + distance;
        td = td + distance;

        if (coords[i][2] < coords[i+1][2]){
            c = c + coords[i+1][2] - coords[i][2];
        } else {
            f = f + coords[i][2] - coords[i+1][2];
        }
        if (sd >= 0.001) {
            d.push({
                x:td,
                y:coords[i][2]
            });
            sd = 0;
        }
    }

    return {xy:d,climb:c,fall:f,totaldistance:td};
}

// add data to chart
function addChart(data) {
    let ctx = document.getElementById('elevation-chart');
    
    let scatterChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Elevation',
                data: data
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom'
                }]
            }
        }
    })
};

// ERROR
function onError(e) {
    alert(e.message);
}