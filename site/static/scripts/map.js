"use strict";


class Map {
    constructor(containerId) {

        this.m_previousZoom = -Infinity;
        this.m_markers = [];

        this.m_map = new google.maps.Map(document.getElementById(containerId), {
            zoom: 13,
            center: {lat: 39.30101350205026, lng: -76.60771203125},
            mapTypeId: google.maps.MapTypeId.SATELLITE
        });

        this.m_map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        this.m_map.addListener('zoom_changed', this._onZoomChanged.bind(this));

        this.m_heatmap = new google.maps.visualization.HeatmapLayer({data: [], map: this.m_map, radius: 20});
        this.m_infoWindow = new google.maps.InfoWindow({content: 'loading'});
    }


    _setMarkersMap(value) {
        for (const entry of this.m_markers) {
            entry.setMap(value);
        }
    }


    _addMarker(location, entry) {
        const marker = new google.maps.Marker({
            position: location,
              size: new google.maps.Size(10, 12),
              icon: {path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 3},
              draggable: false,
              visible: true,
              map: null,
              html: "Crime Type: " + entry.crimeType + "<br>" + "Date: " + entry.date + "<br>" + "Address: " + entry.address
        });

        this.m_markers.push(marker);

        google.maps.event.addListener(marker, 'click', function () {                
            this.m_infoWindow.setContent(marker.html);
            this.m_infoWindow.open(this.m_map, marker);
        }.bind(this));
    }


    _onZoomChanged() {
        const markerZoom = 16;

        if (this.m_map.getZoom() >= markerZoom && this.m_previousZoom < markerZoom) {
            this._setMarkersMap(this.m_map);
            this.m_previousZoom = this.m_map.getZoom();
        } else if (this.m_map.getZoom() < markerZoom && this.m_previousZoom >= markerZoom) {
            this.m_infoWindow.close(); 
            this._setMarkersMap(null);
            this.m_previousZoom = this.m_map.getZoom();
        }
    }


    zoomEntry(location, date, crimeType, address) {
        activateTab('mapView');

        this.m_map.setZoom(20);
        this.m_map.setCenter(new google.maps.LatLng(location[0], location[1]));

        // create invisible marker to display info window
        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(location[0], location[1]),
              size: new google.maps.Size(10, 12),
              icon: {path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 3},
              visible: true,
              map: this.m_map,
              html: "Crime Type: " + crimeType + "<br>" + "Date: " + date + "<br>" + "Address: " + address
        });

        this.m_infoWindow.setContent(marker.html);
        this.m_infoWindow.open(this.m_map, marker);
    }


    toggleHeatmap() {
        this.m_heatmap.setMap(this.m_heatmap.getMap() ? null : this.m_map);
    }


    toggleGradient() {
        const gradient = [
            'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
            ]

            this.m_heatmap.set('gradient', this.m_heatmap.get('gradient') ? null : gradient);
    }


    toggleRadius() {
        this.m_heatmap.set('radius', this.m_heatmap.get('radius') ? null : 20);
    }


    toggleOpacity() {
        this.m_heatmap.set('opacity', this.m_heatmap.get('opacity') ? null : 0.2);
    }


    draw(entries) {
        this._setMarkersMap(null);
        this.m_markers = [];

        const latLong = [];

        for (const entry of entries) {
            if (entry.location) {
                latLong.push(new google.maps.LatLng(entry.location.latitude, entry.location.longitude));                    
                this._addMarker(latLong[latLong.length - 1], entry);
            }
        }

        this.m_heatmap.setData(latLong);
    }
};


let g_map;


function initMap() {
    g_map = new Map('map-div');
};
