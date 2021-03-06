// Return last element of an Array
if (! Array.prototype.last) {
    Array.prototype.last = function () {
        return this[this.length-1];
    }
    Object.defineProperty(Array.prototype, 'last', {enumerable: false});
}

// Return first element of an Array
if (! Array.prototype.first) {
    Array.prototype.first = function () {
        return this[0];
    }
    Object.defineProperty(Array.prototype, 'first', {enumerable: false});
}

// Compare coordinates
// Args: c1, c2 of type L.latLng
// return: true | false
function compareCoord(c1, c2) {
    // return c1.equals(c2);
    var dist = c1.distanceTo(c2);
    console.log("DISTANCE: ", dist);
    return dist < 50;
}

// var messageTag = document.getElementById("message");
// function showMessage(message) {
//     messageTag.innerHTML = message;
// }

function toonMijnRoute (tag) {
    // console.log(myFietsrouteLayer.getLayers());
    console.log(myFietsroute);
    var html = `<table>
        <tr>
            <th class="td-fietsroute-type">Type</th>
            <th>Knooppunt nummer</th>
            <th>Fietsroute Id</th>
        </tr>`;
    for (var i = 0; i < myFietsroute.fietsroute.length; i++) {
        html += "<tr>";
        if (myFietsroute.fietsroute[i].type == "knooppunt") {
            html += '<td class="td-fietsroute-type">' + '<img src="Image/marker-icon-orange.png" alt="Knooppunt">' + "</td>"
                 + "<td>" + "Knooppunt " + myFietsroute.fietsroute[i].element.nr + "</td>"
                 + "<td>" + myFietsroute.fietsroute[i].element.name + "</td>";
        } else { // (myFietsroute[i] == "netwerken")
            html += '<td class="td-fietsroute-type">' + '<img src="Image/route-element.png" alt="Wegdeel">' + "</td>"
                 + "<td>" + "Wegdeel" + "</td>"
                 + "<td>" + myFietsroute.fietsroute[i].element.name + "</td>";
        }
        html += "</tr>";
    }
    html += "</table>";
    // write html to tag
    tag.innerHTML = html;
}

function deleteFietsroute () {
    myFietsroute.deleteAll();
    toonMijnRoute(htmlMijnRoute);
}
