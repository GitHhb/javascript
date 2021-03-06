	var mymap;
	var mycontrol; // The base layer
	var knooppuntLayer; // pdok marker layer
	var knooppunten = []; // Array of type KnooppuntType
    var knooppuntenLoaded = false;
    var netwerken = []; // Array of type NetwerkenType
    var netwerkenLoaded = false;
    var netwerkK2K = []; // Array of type NetwerkK2K
    // myFietsroute contains the fietsroute parts
    // consecutive array elements must have matching coordinates  
    // var myFietsroute = []; // Array of MyFietsrouteType
    var myFietsroute = new FietsrouteType; // Array of MyFietsrouteType

    var messageTag = document.getElementById("message");
    function showMessage(message) {
        messageTag.innerHTML = message;
    }

	// Args: layerName = "knooppunten" | "netwerken"
	//		 map = baseMap handle
	//		 layerControl = control handle
	function initFietsrouteData (layerName, map, layerControl) {
		var mapURL = `
			http://geodata.nationaalgeoregister.nl/fietsknooppuntennetwerk/wms
			?FORMAT=kml
			&TRANSPARENT=TRUE
			&SERVICE=WMS
			&VERSION=1.1.1
			&REQUEST=GetMap
			&STYLES=
			&WIDTH=1047&HEIGHT=1192`;
			// ?LAYERS=knooppunten
			// &SRS=EPSG%3A28992
			// &BBOX=77395.905557391,389014.9,79154.865557391,391018.3
		var crs = "&EPSG%3A4236";
		var bounds = map.getBounds();
		var bbox = "&BBOX=" + bounds._southWest.lng + "," + bounds._southWest.lat + "," + bounds._northEast.lng + "," + bounds._northEast.lat;
		var layers = "&LAYERS=" + layerName;
		mapURL += layers + crs + bbox; 


		console.log(mapURL);
		console.log(bounds._southWest.lng);

		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var xmlDoc = this.responseXML;
                console.log("LOADING all", Boolean(netwerkenLoaded), Boolean(knooppuntenLoaded));
				if ( layerName == "knooppunten") {
					extractKnooppunten(xmlDoc);
                    // layerControl.addOverlay(knooppuntenLayerGroup(knooppunten), "My Knooppunt layer");
                    editKnooppuntenLayer.addLayer(knooppuntenLayerGroup(knooppunten));
                    knooppuntenLoaded = true;
				} else { // layerName == "netwerken"
					extractNetwerken(xmlDoc);
                    // layerControl.addOverlay(netwerkenLayerGroup(netwerken), "My Netwerk layer");
                    editNetwerkLayer.addLayer(netwerkenLayerGroup(netwerken));
                    netwerkenLoaded = true;
				}
                if (false && knooppuntenLoaded && netwerkenLoaded) {
                    console.log("loaded all", Boolean(netwerkenLoaded), Boolean(knooppuntenLoaded));
                    layerControl.addOverlay(matchEndPoints(), "Matching endpoints");
                }
			}
		};
		xhttp.open("GET", mapURL, true);
		xhttp.send();

	}

    function extractKnooppunten (xmlDoc) {
        // A knooppunt section is marked by the "Placemark" tag
        var x = xmlDoc.getElementsByTagName("Placemark");
        for (var i = 0; i < x.length; i++) {
            var name = x[i].getAttribute("id");
            // Tag "name" marks the knooppuntnr
            var knptNr = x[i].getElementsByTagName("name")[0].innerHTML;
            // Tag "coordinates" marks the coordinates
            var knptArr = x[i].getElementsByTagName("coordinates")[0].innerHTML.split(',');
            var pointCoord = L.latLng(knptArr[1], knptArr[0]);
            knooppunten.push(new KnooppuntType(name, knptNr, pointCoord));
            // console.log(knptCoords[1] + ", " + knptCoords[0]);
        }
        // var mydoc = document.getElementById("mapdata");
    }

    
    function extractNetwerken (xmlDoc) {
        // Every "Placemark" tag marks a route part
        var x = xmlDoc.getElementsByTagName("Placemark");
        // Store every route part in the "netwerken" array
        for (var i = 0; i < x.length; i++) {
            var netwerkLineString = []; // LineString of netwerken coords
            // Tag "name" marks the netwerk name
            var netwerkName = x[i].getElementsByTagName("name")[0].innerHTML;
            // Tag "Point > coordinates" marks the Point coordinates
            var pointArr = x[i].getElementsByTagName("Point")[0].getElementsByTagName("coordinates")[0].innerHTML.split(',');
            var pointCoord = L.latLng(pointArr[1], pointArr[0]);
            // Tag "LineString > coordinates" marks the route coordinates
            var lineCoordArr = x[i].getElementsByTagName("LineString")[0].getElementsByTagName("coordinates")[0].innerHTML.split(' ');
            // console.log("NETWERKEN", lineCoordArr);
            for (var j = 0; j < lineCoordArr.length; j++) {
                var s = lineCoordArr[j].split(',');
                netwerkLineString.push(L.latLng(s[1], s[0]));
            }
            netwerken.push(new NetwerkenType(netwerkName, pointCoord, netwerkLineString));
            // console.log(knptCoords[1] + ", " + knptCoords[0]);
        }
        // var mydoc = document.getElementById("mapdata");
    }

    var iconOrange = L.icon({
        iconUrl: 'Image/marker-icon-orange.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [-3, -76],
        // shadowUrl: 'my-icon-shadow.png',
        shadowSize: [68, 95],
        shadowAnchor: [22, 94]
    }); 

    // Args: type = "knooppunt" | "netwerken"
    // layer: any layer type, f.e.: L.polyline or L.marker
    // Return: updated fietsroute or user message with reason that update is not possible 
    var updateMyFietsrouteLayer = function (type, index, layer) {
        var selected = false;
        // var layer;
        var myFietsrouteIndex;
        // Toggle selection and thus visibility
        return function (e) {
            // console.log(layer, e._leaflet_id);
            if (!selected) {
                var len;
                if ( (len = myFietsroute.add(type, index, this)) > 0 ) { 
                    myFietsrouteLayer.addLayer(layer);
                    console.log("THS", this);
                    // myFietsrouteIndex = myFietsroute.push(new MyFietsrouteType(type, index)) - 1;
                    myFietsrouteIndex = len - 1;
                    console.log("PUSHED index: " + myFietsrouteIndex);
                    selected = true;
                }
            } else {
                // remove fietsroute element
                console.log("REMOVE index: " + myFietsrouteIndex);
                if (myFietsrouteIndex < myFietsroute.fietsroute.length-1) {
                    myFietsroute.fietsroute[myFietsrouteIndex + 1].layer.fire('click');
                }
                    myFietsrouteLayer.removeLayer(layer);
                    myFietsroute.delete();
                    // myFietsroute.fietsroute.splice(myFietsrouteIndex, 1);
                selected = false;
            };
            // selected = !selected;
            showMessage(myFietsroute.statusMessage);
            toonMijnRoute();
        }
    }

	// Create layergroup of knooppunten
	// Arg: knooppunten = array of type Knooppunt
	function knooppuntenLayerGroup (knooppunten) {
		// create array with knooppunt markers
		var knptMarkers = [];
		for (k in knooppunten) {
            i = knooppunten[k];
            // Create default knooppunt marker
            knptMarkers.push(
				L.marker(i.point) //.bindPopup(i.nr + "<br>(" + i.point.lat + ", " + i.point.lng + ")")
            );
            // Create select/deselect button for knooppunt
            knptMarkers.push(
				// L.marker(i.point).bindPopup(i.nr + "<br>(" + i.point.lat + ", " + i.point.lng + ")")
                L.marker(i.point, {icon: L.divIcon({
                    iconSize: [12, 12],
                    iconAnchor: [16, 60],
                        html: "<b>" + i.nr + "</b>",
                        className: 'markerDivIcon',
                        riseOnHover: true,
                        title: "I'm the title"
                    })})
				.bindTooltip(i.nr + " " + i.name + "<br>(" + i.point.lat + ", " + i.point.lng + ")", {
                    riseOnHover: true,
					direction: 'top',
                    opacity: 0.8,
					offset: [-14, -55],
					className: 'markerTooltip'
				})
                .on('click', updateMyFietsrouteLayer("knooppunt", k,  L.marker(i.point, {icon: iconOrange}) ))
                );
		}
		return L.layerGroup(knptMarkers);
	}

	// Arg: netwerken = array of type NetwerkenType
	function netwerkenLayerGroup (netwerken) {
        var networkLayerGroup = L.layerGroup();
		// create array with knooppunt markers
		var netwerkMarkers = [];
		for (n in netwerken) {
            i = netwerken[n];
            networkLayerGroup.addLayer(L.marker(i.point, {icon: L.divIcon({
                        html: "<i>" + i.name.split('.')[1] + "</i>",
                        className: 'netwerkDivIcon',
                        riseOnHover: true,
                        title: "I'm the title",
                        offset: [-5, -5]
                    })})
                .bindTooltip(
                    i.name + "<br>(End1: " + i.coordinateArr[0].lat + ", " + i.coordinateArr[0].lng + ")<br>End2: "
                    + i.coordinateArr[i.coordinateArr.length-1].lat + ", " + i.coordinateArr[i.coordinateArr.length-1].lng + ")", {
                        direction: 'top',
                        opacity: 0.8,
                        offset: [5, -5]
                    }
                )
                .on('click', updateMyFietsrouteLayer("netwerken", n,  L.polyline(i.coordinateArr, {color: 'orange'})))
            );
		}
		return networkLayerGroup;
	}

    
    function matchEndPoints () {
        var netwerkMarkers = [];
        var epAll = [];
        var ep = [];
        epAll[0] = []; epAll[1] = []; epAll[2] = []; // all endpoints
        for (var n = 0; n < netwerken.length; n++) {
            var ep = [];
            for (var i = 0; i < knooppunten.length; i++) {
                // look for match at first coord of line
                if ( compareCoord(knooppunten[i].point, netwerken[n].coordinateArr[0]) )  {
                    // Input sanity check, we shouldn't already have a first endpoint
                    if (netwerken[n].first) console.log("WARNING: double 'first' linepoint found for network: ", netwerken[n].name);
                    // console.log("match for ", i.nr);
                    ep.push(i);
                    netwerken[n].first = i;
                } 
                // look for match at last coord of line
                if ( compareCoord(knooppunten[i].point, netwerken[n].coordinateArr[netwerken[n].coordinateArr.length-1]) )  {
                    // Input sanity check, we shouldn't already have a last endpoint 
                    if (netwerken[n].last) console.log("WARNING: double 'last' linepoint found for network: ", netwerken[n].name);
                    ep.push(i);
                    netwerken[n].last = i;
                }
            }
            // console.log("==1> ", "epAll[" + ep.length + "]", "epAll.length: " + epAll.length);
            epAll[ep.length].push(n);
            // console.log("==2> n: ", n);
            // console.log("==3> 0: " + epAll[0].length + " |1:" + epAll[1].length + " |2:" + epAll[2].length + " - " + ep.length);
            if (ep.length == 0) {
                netwerkMarkers.push(L.polyline(netwerken[n].coordinateArr, {color: 'red'})
                    .on('click', function () {
                        var myn = netwerken[n];
                        var myk = knooppunten;
                        return function(e){console.log(e, myn.name, myk[myn.first], myk[myn.last]);
                    } }()));
                // console.log("#0 Endpoints found: ", n);
            } else if (ep.length == 1) {
                // console.log("#1 Endpoints found: ", n);
                netwerkMarkers.push(L.polyline(netwerken[n].coordinateArr, {color: 'black'})
                    .on('click', function () {
                        var myn = netwerken[n];
                        var myk = knooppunten;
                        return function(e){console.log(e, myn.name, myk[myn.first], myk[myn.last]);
                    } }()));
                    // .on('click', function(e){console.log(netwerken[n].name, netwerken[n].first, netwerken[n].last);}));
            } else if (ep.length == 2) {
                // console.log("#2 Endpoints found: ", n);
                // console.log("==4> MATCH found: ", netwerken[n]);
                netwerkMarkers.push(L.polyline(netwerken[n].coordinateArr, {color: 'blue'})
                    .on('click', function () {
                        var myn = netwerken[n];
                        var myk = knooppunten;
                        return function(e){console.log(e, myn.name, myk[myn.first], myk[myn.last]);
                    } }()));
                    // .on('click', function(e){console.log(netwerken[n].name, netwerken[n].first, netwerken[n].last);}));
            } else {
                console.log("WARNING: More than 2 Endpoints found, this is unexpected, not processing this data.", n);
                // netwerkMarkers.push(L.polyline(n.coordinateArr, {color: 'yellow'}).on('click', function(e){console.log(n.name);}));
            }
        }
        // console.log("Processed all endpoints", "2 endpoints: " + epAll[2].length, "1 endpoint: " + epAll[1].length, "0 endpoint: " + epAll[0].length);
        console.log("==3> 0: " + epAll[0].length + " |1:" + epAll[1].length + " |2:" + epAll[2].length + " - " + ep.length);
        // console.log("==3> 0: " + epAll[0] + " |1:" + epAll[1] + " |2:" + epAll[2] + " - " + ep.length);

        // Construct neterkK2K
        // Try to construct complete netwerk parts fromt knooppunt to knooppunt

        // Add all netwerken with 2 endpoints
        netwerkK2K = epAll[2].slice();
        
        // Try to connect netwerken with 1 endpoint
        for (var i = 0; i < epAll[1].length; i++) {

        }

        console.log(netwerkK2K, epAll[2]);
        // check if open endpoints can be matched
        // for (n of epAll[0]) {
        //     for (i of epAll[1]) {
        //          // look for match
        //         if ( (i.coordinateArr[0].lat == n.coordinateArr[0].lat) && (i.coordinateArr[0].lng == n.coordinateArr[0].lng) )  {
        //             // console.log("match for ", i.nr);
        //             ep.push(i);
        //         } 
        //     }
        // }
        return L.layerGroup(netwerkMarkers);
    }


    // Define map and layers

	var baselayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets'
	});

    // If initial value of zoom too low then no kml data will be loaded 
	mymap = L.map('mapid', {
		center: [51.497469, 4.271493],
		zoom: 12,
		layers: [baselayer]
	});
	
	// L.marker([51.5, 4.19]).addTo(mymap)
	// 	.bindPopup("<b>Hello world!</b><br />I am a popup."); //.openPopup();

    var emptyLayer = L.tileLayer('');
	// knooppuntLayer = L.marker();
	// knooppuntLayer = L.layerGroup([L.marker([51.49728786029085, 4.283883498524014]).bindPopup("hoi")]); //.addLayer(knooppuntLayer);
	// knooppuntLayer = L.marker([51.49728786029085, 4.283883498524014]);
	// knooppuntLayer = L.layerGroup([markerX]);
	
	// officiele knooppunten
	var wmsKnooppuntLayer = L.tileLayer.wms('https://geodata.nationaalgeoregister.nl/fietsknooppuntennetwerk/ows?', {
		layers: 'knooppunten',
		format: 'image/png',
		transparent: true,
	}).addTo(mymap);

	// officieel netwerk
	var wmsNetwerkLayer = L.tileLayer.wms('https://geodata.nationaalgeoregister.nl/fietsknooppuntennetwerk/ows?', {
		layers: 'netwerken',
		format: 'image/png',
		transparent: true,
	}).addTo(mymap);

    var myFietsrouteLayer = new L.LayerGroup().addTo(mymap); // Layer with all parts for my own fietsroute
    var editKnooppuntenLayer = new L.LayerGroup().addTo(mymap); // Layer to edit knooppunten 
    var editNetwerkLayer = new L.LayerGroup().addTo(mymap); // Layer to edit netwerk

	
	var baseMaps = {
		"Basismap": baselayer,
		"No maps": emptyLayer
	}

	var overlayMaps = {
		"Officiele Netwerken"   : wmsNetwerkLayer,
		"Officiele Knooppunten" : wmsKnooppuntLayer,
        "Mijn Fietsroute"       : myFietsrouteLayer,
        "Edit knooppunten"      : editKnooppuntenLayer,
        "Edit netwerken"        : editNetwerkLayer
		// "Knooppunten": knooppuntLayer
	}

	var mycontrol = L.control.layers(baseMaps, overlayMaps).addTo(mymap);
	// L.layerGroup([L.marker([51.49728786029085, 4.284883498524014]).bindPopup("nieuw")]).addLayer(knooppuntLayer).addTo(mymap);
	initFietsrouteData("knooppunten", mymap, mycontrol);
	initFietsrouteData("netwerken", mymap, mycontrol);
	// console.log(xtd);
	// mycontrol.addOverlay(xtd, "2e knooppunten");
	// mycontrol.addLayer(initFietsrouteData(), "knoop");

    // // Convenience method: show coordinates of map location when map is clicked
	// function onMapClick(e) {
	// 	L.popup()
	// 		.setLatLng(e.latlng)
	// 		.setContent("Coordinaten:<br>" + e.latlng.toString())
	// 		.openOn(mymap);
	// }
	// mymap.on('click', onMapClick);

    // Implement "Toon route" button
    htmlMijnRoute = document.getElementById("mijn-route");
    htmlMijnRoute.innerHTML = "Initializing...";

    function toonMijnRoute () {
        // console.log(myFietsrouteLayer.getLayers());
        console.log(myFietsroute);
        var txt = "";
        for (var i = 0; i < myFietsroute.fietsroute.length; i++) {
            if (myFietsroute.fietsroute[i].type == "knooppunt") {
                txt += "K: " + knooppunten[myFietsroute.fietsroute[i].index].nr;
            } else { // (myFietsroute[i] == "netwerken")
                txt += "N: " + netwerken[myFietsroute.fietsroute[i].index].name;
            }
            txt += " - ";
        }
        // htmlMijnRoute.innerHTML = myFietsrouteLayer.getLayers();
        htmlMijnRoute.innerHTML = txt;
    }

    toonMijnRoute();
