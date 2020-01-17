var viewer = null;
var users = null;
var labels = null;
var artifacts = null;
var connection = null;
var canceledLoading = false;
$(document).ready(function () {

    setupVisuals();
    artifacts = []
    
    users = {};
    labels = {};
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiODg4MzNhYi00NGIyLTQ4NTctODljOC1kNTZjY2FkMWY0YjEiLCJpZCI6MTAxMjcsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJhc3ciLCJnYyJdLCJpYXQiOjE1NTk2NjMyMTZ9.-XK9KKFK9zYS9FiwpptglIjGNV9cXlR28LDcixQJG8k';
    viewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider: Cesium.createWorldTerrain(),
        infoBox: false,
        selectionIndicator: false,
        shadows: true,
        shouldAnimate: true
    });

    setupArtifactSending();
    initArtifacts();
    $("#user-search").on("input", function (e) {
        if (e.target.value.length === 0) {
            $(".user").show();
            return;
        }
        var users = $(".user");
        for (var i = 0; i < users.length; i++) {
            if (users[i].getAttribute("value").toLowerCase().includes(e.target.value.toLowerCase())) {
                $(users[i]).show();
            } else {
                $(users[i]).hide();
            }
        }
    });

    connection = new signalR.HubConnectionBuilder().withUrl("/cesium").build();

    connection.on("NewActiveUser", function (name) {
        var newElement = document.createElement("div");
        newElement.className = "form-control user";
        newElement.style = "outline-style: none;";
        newElement.innerText = name;
        newElement.setAttribute("value", name);
        newElement.onclick = function (event) { userClicked(event, connection, viewer, users, name); };
        $("#active-users")[0].appendChild(newElement);
        var newButton = document.createElement("button");
        newButton.className = "btn btn-info";
        newButton.style = "float:right;height:100%;display: inline-flex;text-align: center;font-size:x-small;z-index:999999";
        newButton.innerText = "Focus";
        newButton.onclick = function (event) { userDblClicked(event, viewer, users, name); };
        newElement.appendChild(newButton);
    });
    connection.on("InactiveUser", function (name) {
        var option = $("#active-users > div[value=" + name + "]");
        if (option.length === 0) return;
        option = option[0];
        option.parentNode.removeChild(option);
        if (users[name] !== undefined) {
            viewer.entities.remove(users[name]);
            users[name] = null;
        }
    });
    connection.on("Position", function (name, longitude, latitude) {
        if (users[name] === undefined) {
            try {
                var entity = viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(latitude, longitude),
                    model: {
                        uri: "/js/Cesium_Man.js",
                        minimumPixelSize: 64,
                        maximumScale: 20000

                    }

                });
                var promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [Cesium.Cartographic.fromDegrees(latitude, longitude)]);
                Cesium.when(promise, function (position) {
                    position = position[0];
                    entity.position = Cesium.Cartesian3.fromDegrees(latitude, longitude, position.height);

                });
                var lab = {
                    text: name,
                    font: '24px Helvetica',
                    fillColor: Cesium.Color.SKYBLUE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.CENTER,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    scale: 0.8
                };
                entity.label = new Cesium.LabelGraphics(lab);
                users[name] = entity;
            } catch (err) {
                console.log(err);
            }
        } else {
            promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [Cesium.Cartographic.fromDegrees(latitude, longitude)]);
            Cesium.when(promise, function (position) {
                var model = users[name];
                position = position[0];
                model.position = Cesium.Cartesian3.fromDegrees(latitude, longitude, position.height);
            });
        }

    });

    connection.onclose(function () {
        setTimeout(function () {
            connection.reconnect();
        }, 5000);
    });

    connection.start();


    $.ajax({
        url: "/ActiveUsers",
        method: "GET",
        success: function (result) {
            for (var i = 0; i < result.length; i++) {
                const name = result[i];
                var newElement = document.createElement("div");
                newElement.className = "form-control user";
                newElement.style = "outline-style: none;";
                newElement.innerText = name;
                newElement.setAttribute("value", name);
                newElement.onclick = function (event) { userClicked(event, connection, viewer, users, name); };
                $("#active-users")[0].appendChild(newElement);
                var newButton = document.createElement("button");
                newButton.className = "btn btn-info";
                newButton.style = "float:right;height:100%;display: inline-flex;text-align: center;font-size:x-small;z-index:999999";
                newButton.innerText = "Focus";
                newButton.onclick = function (event) { userDblClicked(event, viewer, users, name); };
                newElement.appendChild(newButton);
            }
        }
    });

});

function initArtifacts() {
    $.ajax({
        url: "/Artifact/GetActiveArtifacts",
        success: function (result) {
            for (let i = 0; i < result.length; i++) {
                artifacts.push(viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(result[i].longitude, result[i].latitude),
                    billboard: {
                        scale: 0.8,
                        width: 100,
                        minimumPixelSize: 64,
                        verticalOrigin: Cesium.VerticalOrigin.CENTER,
                        disableDepthTestDistance: 100000000,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        height: 25,
                        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAkQAAAImCAYAAACy3JULAAAACXBIWXMAAAsSAAALEgHS3X78AAAVNklEQVR42u3WsZHCQBREQZlrEtelJPdSIQSloxQwZe5dABhYGolpql4CC3/oZc65SJIkNecRJEkSEHkESZIERB5BkiQBkUeQJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSWtrWMRvz3UtAJElA5LuXgEiSgMh3LwGRJAGR718CIkkCIklAJElAJAmIJAmIJAGRJAGRJCCSJCCSBESSBESSgEiSgEgSEEkCIiCSBESSgAiIJAGRJCACIklAJAmIgEgSEEkCIiCSBESSgAiIJAGRJCACIklAJAmIgEgSEEkCIiCSBESSgAiIJAGRJCACIklAJAmIgEgSEEkCIiCSBESSgAiIJAGRJCACIklAJAmIgEgSEEkCIiCSBESSgAiIJAGRJCACIklAJAmIgEgSEEmqQsmxdwZjEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCQJiIAIiCQgkgREQAREEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCQJiIAIiCQgkgREQAREEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCQJiIAIiCQgkgREQAREEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCSpCkRzdgZEEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCQJiIAIiCQgkgREQAREEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCQJiIAIiCQgkgREQAREEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCQJiIAIiCQgkgREQAREEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCRBSeIPMvhpRVHuA2MSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEKkeBsmOPdecv8FaQZR78+RvrfW+bbuASEAEREAEREBk2wVEAiIgAiIgAiLbLiASEAEREAERENl3AZGACIiACIiASAIiAREQAREQAZEERAIiIAIiIAIiCYgEREAEREAERBIQCYiACIiACIgkIBIQAREQAREQSUAkIAIiIAIiIJKASEAEREAEREAkAZGACIiACIiASPIIAiIgAiIgAiIBkUcQEAEREAEREAmIPIKACIiACIiASEDkEQREQAREQAREAiIJiIAIiIAIiAREEhABERABERAJiCQgAiIgAiIgEhBJQAREQAREQCQgkoAIiIAIiIBIQCQBERABERABkYBIAiIgAiIgAiIBkQREQAREQAREAiIJiIAIiIAIiAREEhABERABERAJiCQgAiIgAiIgEhBJQAREQAREQCQgkoAIiIAIiIBIQCQBERABERABkYDoBq0/y0zVOxzJP+fkB0r0/RhrvbHWPU/+hwIREAGRsQYiAREQAREQAREQGWsgEhABERABERABkbEGIgEREAEREAEREBlrIBIQAREQAREQAZGxBiIBERABERABERAZayASEAEREAEREAGRsQYiAREQAREQAREQGWsgEhABERABERABkbEGIgEREAEREAEREBlrIBIQAREQAREQAZGxBiIBERABERABERAZayASEAEREAEREAGRsQYiAREQAREQAREQGWsgEhABERABERABkbEGIgEREAEREAEREBlrIBIQAREQAREQAZGxBiIBERABERABERAZayASEAEREAEREAGRsQYiAREQAREQAREQGWsgEhABERABERABkbEGIgEREAEREAEREBlrIBIQAREQAREQAZGxBiIBERABERABERAZayASEAEREAEREAGRsQYiAREQAREQAREQGWsgEhABERABERABkbEGIgEREAEREAEREBlrIJIbAyIgAiIgAiJjDURyY0AEREAEREBkrIFIbgyIgAiIbgWiYx+x/DmfX/L7Xv7PM1Xr95188+y2QOjZJb9vIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiININMLatI1brWAMREAHR995YclOhBIiACIiMNRABERABERABERABkbEGIiACIiACIiACIiAy1kAEREAEREAEREAERMYaiIAIiIAIiIAIiIDIWAMREAEREAEREAEREBlrIAIiIAIiIAIiIAIiYw1EQAREQAREQAREQGSsgQiIgAiIgAiIgAiIjDUQAREQAREQAREQAZGxBiIgAiIgAiIgAiIgMtZABERABERABERABETGGoiACIiACIiACIiAyFgDERABERABERABERAZayACIiACIiACIiACImMNREAEREAEREAEREBkrIEIiIAIiIAIiIAIiIw1EAEREAEREAEREAGRsQYiIAIiIAIiIAIiIDLWQAREbgyIgAiIgAiIjDUQAZEbAyIgAiIgAiJjDURA5MaACIiACIiAyFgDERC5MSACIiACIiAy1kAERG4MiIAIiIAIiIw1EAGRGwMiIAIiIAIiYw1EQOTGgAiIgAiIgMhYAxEQuTEgAiIgAiIgMtZABERuDIiACIiACIiMNRABkRsDIiACIiACImMNREDkxoAIiIAIiIDIWAMRELkxIAIiIBKMval1rLOD2Qmi5Ju3gghKBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJBir/6N4PR+xWkHU+ua98LftAiIBERABkTcHIvsuIBIQAREQeXMgkoBIQAREQOTNgUgCIgEREAGRNwciCYgEREAERN4ciCQgEhABERB5cyCSgEhABERA5M2BSAIiAREQAZE3ByIJiAREQAREQAREEhAJiIAIiIAIiCSPICACIiACIiASEHkEAREQAREQAZGAyCMIiIAIiIAIiAREHkFABERABERAJCCSgAiIgAiIgEhAJAEREAEREAGRgEgCIiACIiACIgGRBERABERABEQCIgmIgAiIgAiIBEQSEAEREAEREAmIJCACIiACIiASEElABERABERAJCCSgAiIgAiIgEhAJAEREAEREAGRgEgCIiACIiACIgGRBERABERABEQCIgmIgAiIgAiIBEQSEAEREAEREAmIJCACIiACIiASEElABERABERAJCCSgOgCIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERFByets6YvmTUkOtv/PktsCYgAiIgAiIBERABEQCIiACIiASEAEREAmIgAiIgEhABERAJCACIiACIgEREAGRgAiIgAiIBERABEQCIiACIiASEAEREAmIgAiIgEhABERAJCACIiACIgEREAGRgAiIgAiIBERABEQCIiACIiASEAEREAmIgAiIgEhABERAJCACIiACIgEREAGRPAIQAREQCYiACIiAyCMAERABkYAIiIAIiDwCEAEREAmIgAiIgMgjABEQAZGACIiACIgEREAERAIiIAIiIBIQAREQCYiACIiASEAEREAkIAIiIAIiAREQAZGACIiACIgEREAERAIiIAIiIBIQAREQCYiACIiASEAEREAkIAIiIAIiAREQAZGACIiACIgEREAERAIiIAIiIBIQAREQCYiACIiASEAEREAkIAIiIAIiAREQAZGACIiACIgEREAERAIiIAIiIBIQAREQCYiACIiASED0ptfzEasVJck3T/7WWn/nrRhr/Z37TwMiAREQAREQAREQ+U8DIgEREAEREAEREPlPAyIBERABERABERD5XwMiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASEAEREAEREAERAIiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASEAEREAEREAERAIiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASEAEREAEREAERAIiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASEAEREAEREAERAIiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASEAEREAEREAERAIiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASEAEREAEREAERAIiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASJcFUSsMtnXEMtZdN5b8rbVC0I0JiIw1EAGRsQYiIHJjAiJjDURAZKyBCIjcmIDIWAMREBlrIAIiNyYgMtZABETGGoiAyI0JiIw1EAGRsQYiIHJjAiJjDURAZKyBCIjcmIDIWAMREBlrIAIiNyYgMtZABETGGoiAyI0JiIw1EAGRsQYiIHJjAiJjDURAZKyBCIjcmIDIWAMREBlrIAIiNyYgMtZABETGGoiAyI3JIxhrIAIiYw1EQOTGgMgjGGsgAiJjDURA5MaAyCMYayACImMNREDkxoDIIxhrIAIiYw1EQOTGgEjGGoiAyFgDERC5MSCSsQYiIDLWQAREbgyIZKyBCIiMNRABkRsDIhlrIAIiYw1EQOTGgEjGGoiACIiACIjcGBDJWAMREAEREAGRGwMiGWsgAiIgAiIgcmNAJGMNREAEREAERG4MiGSsgQiIgAiIgMiNAZGMNRABERABERC5MSCSsQYiIAIiIAIiNwZEMtZABERABERA5MaASMYaiIAIiIAIiNwYEMlYAxEQuTEgAiI3BkQy1rpEfvPuW+5bQCSDaTD95t233LeASAbTYPrNu2+5bwGRDKbB9Lt333LfAiIZTIMp9y33LSCSwTSYct9y3wIiGUyDKfct9y0gksE0mHLfct8CIhlMgyn3LfctIJLBNJhy33LfAiIZTIMp9y33LSCSwTSYct9y3wIiGUyDKfct9y0gksE0mHLfct8CIhlMgyn3LfctIJLBNJhy33LfAiIZTIMp9y33LSCSwTSYct9y3wIiGUyDKfct9y0gksE0mHLfct8CIhkRgyn3LfctIDKYRsRgyn3LfQuIDKYRMZhy33LfAiKDaUgMpty33LeAyGDKYMp9y30LiAymDKbct9y3gMhgymDKfct9C4gMpgym3Lfct4DIYMpgyn3LfQuIDKYMpty33LeAyGDKYMp9y30LiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkj7oD11AAUFMSoNcAAAAAElFTkSuQmCC'
                    }
                }));
            }
        }, error: function (error) {
            console.log(error);
        }
    });
}

function setupArtifactSending() {
    viewer.scene.canvas.addEventListener('click', function (e) {
        if ($("#artifact-placement-active").prop("checked")) {
            var ellipsoid = viewer.scene.globe.ellipsoid;
            var cartesian = viewer.camera.pickEllipsoid(new Cesium.Cartesian3(e.clientX - $("#active-users").width(), e.clientY - $("#navbar").height()), ellipsoid);
            if (cartesian) {
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                var longitude = Cesium.Math.toDegrees(cartographic.longitude);
                var latitude = Cesium.Math.toDegrees(cartographic.latitude);
                if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
                    var data = {
                        "longitude": longitude, "latitude": latitude};
                    $.ajax({
                        method: "POST",
                        data: JSON.stringify(data),
                        headers:{"Content-Type":"application/json"},
                        url: "/Artifact/AddArtifact",
                        success: function (result) {
                            console.log(result);
                                viewer.entities.add({
                                    position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
                                    billboard: {
                                        scale: 0.8,
                                        width: 100,
                                        verticalOrigin: Cesium.VerticalOrigin.CENTER,
                                        disableDepthTestDistance: 100000000,
                                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                                        height: 25,
                                        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAkQAAAImCAYAAACy3JULAAAACXBIWXMAAAsSAAALEgHS3X78AAAVNklEQVR42u3WsZHCQBREQZlrEtelJPdSIQSloxQwZe5dABhYGolpql4CC3/oZc65SJIkNecRJEkSEHkESZIERB5BkiQBkUeQJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSJElAJEmSBESSWtrWMRvz3UtAJElA5LuXgEiSgMh3LwGRJAGR718CIkkCIklAJElAJAmIJAmIJAGRJAGRJCCSJCCSBESSBESSgEiSgEgSEEkCIiCSBESSgAiIJAGRJCACIklAJAmIgEgSEEkCIiCSBESSgAiIJAGRJCACIklAJAmIgEgSEEkCIiCSBESSgAiIJAGRJCACIklAJAmIgEgSEEkCIiCSBESSgAiIJAGRJCACIklAJAmIgEgSEEkCIiCSBESSgAiIJAGRJCACIklAJAmIgEgSEEmqQsmxdwZjEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCQJiIAIiCQgkgREQAREEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCQJiIAIiCQgkgREQAREEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCQJiIAIiCQgkgREQAREEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCSpCkRzdgZEEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCQJiIAIiCQgkgREQAREEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCQJiIAIiCQgkgREQAREEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCQJiIAIiCQgkgREQAREEhBJAiIgAiIJiCQBERABkQREkoAIiIBIAiJJQAREQCQBkSQgAiIgkoBIEhABERBJQCRBSeIPMvhpRVHuA2MSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEElABERABEQSEKkeBsmOPdecv8FaQZR78+RvrfW+bbuASEAEREAEREBk2wVEAiIgAiIgAiLbLiASEAEREAERENl3AZGACIiACIiASAIiAREQAREQAZEERAIiIAIiIAIiCYgEREAEREAERBIQCYiACIiACIgkIBIQAREQAREQSUAkIAIiIAIiIJKASEAEREAEREAkAZGACIiACIiASPIIAiIgAiIgAiIBkUcQEAEREAEREAmIPIKACIiACIiASEDkEQREQAREQAREAiIJiIAIiIAIiAREEhABERABERAJiCQgAiIgAiIgEhBJQAREQAREQCQgkoAIiIAIiIBIQCQBERABERABkYBIAiIgAiIgAiIBkQREQAREQAREAiIJiIAIiIAIiAREEhABERABERAJiCQgAiIgAiIgEhBJQAREQAREQCQgkoAIiIAIiIBIQCQBERABERABkYDoBq0/y0zVOxzJP+fkB0r0/RhrvbHWPU/+hwIREAGRsQYiAREQAREQAREQGWsgEhABERABERABkbEGIgEREAEREAEREBlrIBIQAREQAREQAZGxBiIBERABERABERAZayASEAEREAEREAGRsQYiAREQAREQAREQGWsgEhABERABERABkbEGIgEREAEREAEREBlrIBIQAREQAREQAZGxBiIBERABERABERAZayASEAEREAEREAGRsQYiAREQAREQAREQGWsgEhABERABERABkbEGIgEREAEREAEREBlrIBIQAREQAREQAZGxBiIBERABERABERAZayASEAEREAEREAGRsQYiAREQAREQAREQGWsgEhABERABERABkbEGIgEREAEREAEREBlrIBIQAREQAREQAZGxBiIBERABERABERAZayASEAEREAEREAGRsQYiAREQAREQAREQGWsgEhABERABERABkbEGIgEREAEREAEREBlrIJIbAyIgAiIgAiJjDURyY0AEREAEREBkrIFIbgyIgAiIbgWiYx+x/DmfX/L7Xv7PM1Xr95188+y2QOjZJb9vIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiIAIiININMLatI1brWAMREAHR995YclOhBIiACIiMNRABERABERABERABkbEGIiACIiACIiACIiAy1kAEREAEREAEREAERMYaiIAIiIAIiIAIiIDIWAMREAEREAEREAEREBlrIAIiIAIiIAIiIAIiYw1EQAREQAREQAREQGSsgQiIgAiIgAiIgAiIjDUQAREQAREQAREQAZGxBiIgAiIgAiIgAiIgMtZABERABERABERABETGGoiACIiACIiACIiAyFgDERABERABERABERAZayACIiACIiACIiACImMNREAEREAEREAEREBkrIEIiIAIiIAIiIAIiIw1EAEREAEREAEREAGRsQYiIAIiIAIiIAIiIDLWQAREbgyIgAiIgAiIjDUQAZEbAyIgAiIgAiJjDURA5MaACIiACIiAyFgDERC5MSACIiACIiAy1kAERG4MiIAIiIAIiIw1EAGRGwMiIAIiIAIiYw1EQOTGgAiIgAiIgMhYAxEQuTEgAiIgAiIgMtZABERuDIiACIiACIiMNRABkRsDIiACIiACImMNREDkxoAIiIAIiIDIWAMRELkxIAIiIBKMval1rLOD2Qmi5Ju3gghKBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJCACIiACIiACIgGRgAiIgAiIgAiIBEQCIiACIiACIiASEAmIgAiIgAiIgEhAJBir/6N4PR+xWkHU+ua98LftAiIBERABkTcHIvsuIBIQAREQeXMgkoBIQAREQOTNgUgCIgEREAGRNwciCYgEREAERN4ciCQgEhABERB5cyCSgEhABERA5M2BSAIiAREQAZE3ByIJiAREQAREQAREEhAJiIAIiIAIiCSPICACIiACIiASEHkEAREQAREQAZGAyCMIiIAIiIAIiAREHkFABERABERAJCCSgAiIgAiIgEhAJAEREAEREAGRgEgCIiACIiACIgGRBERABERABEQCIgmIgAiIgAiIBEQSEAEREAEREAmIJCACIiACIiASEElABERABERAJCCSgAiIgAiIgEhAJAEREAEREAGRgEgCIiACIiACIgGRBERABERABEQCIgmIgAiIgAiIBEQSEAEREAEREAmIJCACIiACIiASEElABERABERAJCCSgOgCIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERAIiIJKACIgERFByets6YvmTUkOtv/PktsCYgAiIgAiIBERABEQCIiACIiASEAEREAmIgAiIgEhABERAJCACIiACIgEREAGRgAiIgAiIBERABEQCIiACIiASEAEREAmIgAiIgEhABERAJCACIiACIgEREAGRgAiIgAiIBERABEQCIiACIiASEAEREAmIgAiIgEhABERAJCACIiACIgEREAGRPAIQAREQCYiACIiAyCMAERABkYAIiIAIiDwCEAEREAmIgAiIgMgjABEQAZGACIiACIgEREAERAIiIAIiIBIQAREQCYiACIiASEAEREAkIAIiIAIiAREQAZGACIiACIgEREAERAIiIAIiIBIQAREQCYiACIiASEAEREAkIAIiIAIiAREQAZGACIiACIgEREAERAIiIAIiIBIQAREQCYiACIiASEAEREAkIAIiIAIiAREQAZGACIiACIgEREAERAIiIAIiIBIQAREQCYiACIiASED0ptfzEasVJck3T/7WWn/nrRhr/Z37TwMiAREQAREQAREQ+U8DIgEREAEREAEREPlPAyIBERABERABERD5XwMiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASEAEREAEREAERAIiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASEAEREAEREAERAIiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASEAEREAEREAERAIiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASEAEREAEREAERAIiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASEAEREAEREAERAIiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASEAEREAEREAERAIiAREQAREQAREQCYgEREAEREAEREAkIBIQAREQAREQAZGASJcFUSsMtnXEMtZdN5b8rbVC0I0JiIw1EAGRsQYiIHJjAiJjDURAZKyBCIjcmIDIWAMREBlrIAIiNyYgMtZABETGGoiAyI0JiIw1EAGRsQYiIHJjAiJjDURAZKyBCIjcmIDIWAMREBlrIAIiNyYgMtZABETGGoiAyI0JiIw1EAGRsQYiIHJjAiJjDURAZKyBCIjcmIDIWAMREBlrIAIiNyYgMtZABETGGoiAyI3JIxhrIAIiYw1EQOTGgMgjGGsgAiJjDURA5MaAyCMYayACImMNREDkxoDIIxhrIAIiYw1EQOTGgEjGGoiAyFgDERC5MSCSsQYiIDLWQAREbgyIZKyBCIiMNRABkRsDIhlrIAIiYw1EQOTGgEjGGoiACIiACIjcGBDJWAMREAEREAGRGwMiGWsgAiIgAiIgcmNAJGMNREAEREAERG4MiGSsgQiIgAiIgMiNAZGMNRABERABERC5MSCSsQYiIAIiIAIiNwZEMtZABERABERA5MaASMYaiIAIiIAIiNwYEMlYAxEQuTEgAiI3BkQy1rpEfvPuW+5bQCSDaTD95t233LeASAbTYPrNu2+5bwGRDKbB9Lt333LfAiIZTIMp9y33LSCSwTSYct9y3wIiGUyDKfct9y0gksE0mHLfct8CIhlMgyn3LfctIJLBNJhy33LfAiIZTIMp9y33LSCSwTSYct9y3wIiGUyDKfct9y0gksE0mHLfct8CIhlMgyn3LfctIJLBNJhy33LfAiIZTIMp9y33LSCSwTSYct9y3wIiGUyDKfct9y0gksE0mHLfct8CIhkRgyn3LfctIDKYRsRgyn3LfQuIDKYRMZhy33LfAiKDaUgMpty33LeAyGDKYMp9y30LiAymDKbct9y3gMhgymDKfct9C4gMpgym3Lfct4DIYMpgyn3LfQuIDKYMpty33LeAyGDKYMp9y30LiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkoBIkiQJiCRJkj7oD11AAUFMSoNcAAAAAElFTkSuQmCC'
                                    }
                                });

                        },
                        error: function (error) { console.log(error); }
                    });
                    $("#artifact-placement-active").bootstrapToggle("off");
                }
            } else {
                alert('Pick a more detailed location!');
            }
        }
    }, false);
}


function setupVisuals() {
    $("#history-users").select2();
    $("#history-confirm").on("click", loadHistoricalData);
    $('#historymodal').on('shown.bs.modal', function () {
        $("#history-confirm").attr("disabled", false);
        $.ajax({
            method: "GET",
            url: "/AllUsers",
            success: function (result) {
                $("#history-users").empty();
                for (var i = 0; i < result.length; i++) {
                    $("#history-users").append("<option value='" + result[i] + "'>" + result[i] + "</option>");
                }
            }

        });

    });
}

function canceledLoadingClicked() {
    canceledLoading = true;
}


function loadHistoricalData() {
    if ($("#history-users").val().length === 0) {
        alert("Select at least one user!");
        return;
    }
    var fromDate = $("#date-from").val();
    var fromTime = $("#time-from").val();
    if (fromDate === "" && toDate === "") {
        alert("Set at least a start or end date!");
        return;
    }
    $("#history-confirm").attr("disabled", true);
    
    var toDate = $("#date-to").val();
    var toTime = $("#time-to").val();
    if (fromDate === "") {
        fromDate = "01-01-2000";
    }
    if (toDate === "") {
        toDate = Date.now().toString();
    }
    if (fromTime === "") {
        fromTime = "00:00:00";
    }
    if (toTime === "") {
        toTime = "23:59";
    }
    var data = { "names": $("#history-users").val(), "from": fromDate+"T"+fromTime ,"to": toDate+"T"+toTime };
    $.ajax({
        method: "POST",
        url: "/GetHistoricalData",
        data: data,
        success: function (result) { createPaths(result); },
        error: function (result) { alert("Something went wrong!");}
    });
}


function createPaths(result) {
    let czml = JSON.parse(JSON.stringify(czmlTemplate));
    let maxTime, minTime = undefined;
    let hasAny = false;
    for (const [key, value] of Object.entries(result)) {
        if (value.length !== 0) {
            hasAny = true;
        }
    }

    if (!hasAny) {
        alert("No stored coordinates have been found for the given input!");
        return;
    }
    let maxPaths = 0;

    for (const [key, value] of Object.entries(result)) {
        if (value.length !== 0) {
            maxPaths += 1;
            var date = new Date(value[0].time);
            if (minTime === undefined || minTime > date) {
                minTime = date;
            }
            date = new Date(value[value.length - 1].time);
            if (maxTime === undefined || maxTime < date) {
                maxTime = date;
            }
            console.log(minTime.toISOString());
            console.log(maxTime.toISOString());
        }
    }


    czml[0].clock.interval = minTime.toISOString() + "/" + maxTime.toISOString();
    czml[0].clock.currentTime = minTime.toISOString();
    for (const [key, value] of Object.entries(result)) {
        if (value.length === 0) {
            continue;
        }
        let czmlPath = JSON.parse(JSON.stringify(pathTemplate));
        for (var i = 0; i < 3; i++) {
            czmlPath.path.material.polylineOutline.color.rgba.push(Math.floor(Math.random() * 256));
        }
        czmlPath.id = key;
        czmlPath.path.material.polylineOutline.color.rgba.push(255);
        czmlPath.path.material.polylineOutline.outlineColor.rgba = czmlPath.path.material.polylineOutline.color.rgba;
        czmlPath.availability = minTime.toISOString() + "/" + maxTime.toISOString();
        czmlPath.label.text = key;
        czmlPath.label.show.interval = minTime.toISOString() + "/" + maxTime.toISOString();
        czmlPath.label.fillColor.interval = minTime.toISOString() + "/" + maxTime.toISOString();
        czmlPath.label.outlineColor = czmlPath.path.material.polylineOutline.color.rgba;
        czmlPath.label.fillColor = czmlPath.path.material.polylineOutline.color.rgba;
        let positions = [];
        for (i = 0; i < value.length; i++) {
            positions.push(Cesium.Cartographic.fromDegrees(value[i].longitude, value[i].latitude));
        }
        let promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positions).then(function (updated) {
            for (let x = 0; x < updated.length; x++) {
                czmlPath.position.cartographicDegrees.push(new Date(value[x].time).toISOString(), value[x].longitude, value[x].latitude, updated[x].height + 0.2);
            }
            czml.push(czmlPath);
            if (czml.length === maxPaths + 1) {
                if (canceledLoading) {
                    canceledLoading = false;
                    return;
                }
                viewer.entities.removeAll();
                viewer.dataSources.removeAll();
                $("#history-confirm").attr("disabled", false);
                $("#historymodal").modal("hide");
                viewer.dataSources.add(Cesium.CzmlDataSource.load(czml)).then(function (ds) {
                    viewer.trackedEntity = ds.entities.getById(key);
                });

            }
            console.log(czml);
        });
        console.log("wat");
    }
}

function toLiveTracking() {
    viewer.dataSources.removeAll();
    for (const [key, value] of Object.entries(users)) {
        viewer.entities.add(value);
    }
}

function userDblClicked(event, viewer, users, name) {
    if (users[name] === undefined) return;
    viewer.flyTo(users[name], { offset: new Cesium.HeadingPitchRange(0, -0.5, 1000) });
}

function userClicked(event, connection, viewer, users, name) {
    var senderElementName = event.target.getAttribute("value");
    if (senderElementName === null || senderElementName === "button") {
        return;
    }
    senderElementName = senderElementName.toLowerCase();
    if ($(event.target).attr("selected") !== "selected") {
        $(event.target).attr("selected", true);
        $(event.target).css("background-color", "coral");
    } else {
        $(event.target).attr("selected", false);
        $(event.target).css("background-color", "");
    }
    if (event.target.getAttribute("selected") === "selected") {
        connection.invoke("AddNewFollowing", $(event.target).contents().get(0).nodeValue);
    } else {
        connection.invoke("RemoveFollowing", $(event.target).contents().get(0).nodeValue);
    }
}

var pathTemplate = {
    "id": "path",
    "availability": "2012-08-04T10:00:00Z/2012-08-04T15:00:00Z",
    "path": {
        "material": {
            "polylineOutline": {
                "color": {
                    "rgba": []
                },
                "outlineColor": {
                    "rgba": []
                },
                "outlineWidth": 5
            }
        },
        "width": 8,
        "leadTime": 10,
        "trailTime": 1000,
        "resolution": 5
    },
    "label": {
        "minimumPixelSize": 128,
        "maximumScale": 20,
        "fillColor": [
            {
                "interval": "2012-08-04T16:00:00Z/2012-08-04T18:00:00Z",
                "rgba": [
                    255, 255, 0, 255
                ]
            }
        ],
        "font": "bold 10pt Segoe UI Semibold",
        "horizontalOrigin": "CENTER",
        "outlineColor": {
            "rgba": [
                0, 0, 0, 255
            ]
        },
        "pixelOffset": {
            "cartesian2": [0,-50]
        },
        "scale": 1.0,
        "show": [
            {
                "interval": "2012-08-04T16:00:00Z/2012-08-04T18:00:00Z",
                "boolean": true
            }
        ],
        "style": "FILL",
        "verticalOrigin": "CENTER"
    },
    "model": {
        "gltf": "/js/Cesium_Man.js",
        "minimumPixelSize": 64,
        "maximumScale": 20000,
        "scale":1.0
    },
    "orientation": {"velocityReference": "#position" },
    "position": {
        "interpolationAlgorithm": "LAGRANGE",
        "interpolationDegree": 1,
        "cartographicDegrees": []
    }
};

var czmlTemplate = [{
    "id": "document",
    "name": "CZML Path",
    "version": "1.0",
    "clock": {
        "interval": "2012-08-04T10:00:00Z/2012-08-04T15:00:00Z",
        "currentTime": "2012-08-04T10:00:00Z",
        "multiplier": 2
    }
}];