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
var colours = ['Red','Green','Aqua','Maroon','Blue','Lime','Fuchsia','Purple','Yellow'];

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
        layer.setStyle({
            color: colours[(feature.properties.track_id-1) % colours.length],
            weight: 3        
        });
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
var ctx = document.getElementById('elevation-chart');
var chart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            label: 'Elevation',
            data: {x:0,y:0}
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
});

// show chart on layer click
map.on('popupopen', function(e){
    let x = document;
    let start = new Date(e.popup._source.feature.properties.start_time);
    let end = new Date(e.popup._source.feature.properties.end_time);
    let time_min = (end.getTime()-start.getTime())/60000;
    let data = geomToDistance(e.popup._source.feature.geometry);

    chart.data.datasets[0].data = data.chartdata;
    chart.update(0);
    
    document.querySelector('#totaldistance').innerHTML = Math.round(data.totaldistance).toLocaleString()+"m";
    document.querySelector('#totaltime').innerHTML = Math.round(time_min)+"min";
    document.querySelector('#averagespeed').innerHTML = Math.round((data.totaldistance/1000)/(time_min/60)*10)/10+"km/h";
    document.querySelector('#totalclimb').innerHTML = Math.round(data.climb).toLocaleString()+"m";
    document.querySelector('#totalfall').innerHTML =  Math.round(data.fall).toLocaleString()+"m";
});

// calculate distance-elevation object from geometry
function geomToDistance(geom){
    let coords = geom.coordinates;
    let td = 0;
    let sd = 0;
    let c = 0;
    let f = 0;
    let xy = [];

    //reproject to EPSG:28355 so distance is in metres
    let epsg28355 = '+proj=utm +zone=55 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
    let p1 = proj4(epsg28355,[coords[0][0],coords[0][1]]);
    let p2 = 0;

    for (i = 0; i < coords.length-1; i++) {
        p2 = proj4(epsg28355,[coords[i+1][0],coords[i+1][1]]);

        // calculate distance traveled
        let deltax = p1[0] - p2[0];
        let deltay = p1[1] - p2[1];
        let distance = Math.sqrt(deltax*deltax + deltay*deltay);
        sd = sd + distance;
        td = td + distance;

        p1 = p2;

        // calculate climb/fall
        if (coords[i][2] < coords[i+1][2]){
            c = c + coords[i+1][2] - coords[i][2];
        } else {
            f = f + coords[i][2] - coords[i+1][2];
        }
        if (sd >= 100) {
            xy.push({
                x:td,
                y:coords[i][2]
            });
            sd = 0;
        }
    }

    return {chartdata:xy,climb:c,fall:f,totaldistance:td};
}

// ERROR
function onError(e) {
    alert(e.message);
}