// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
$(document).ready(function () {



    var users = {};
    var labels = {};
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiODg4MzNhYi00NGIyLTQ4NTctODljOC1kNTZjY2FkMWY0YjEiLCJpZCI6MTAxMjcsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJhc3ciLCJnYyJdLCJpYXQiOjE1NTk2NjMyMTZ9.-XK9KKFK9zYS9FiwpptglIjGNV9cXlR28LDcixQJG8k';
    var viewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider: Cesium.createWorldTerrain(),
            infoBox: false,
            selectionIndicator: false,
            shadows: true,
            shouldAnimate: true
    });

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

    var connection = new signalR.HubConnectionBuilder().withUrl("/cesium").build();

    connection.on("NewActiveUser", function (name) {
        var newElement = document.createElement("div");
        newElement.className = "form-control user";
        newElement.style = "outline-style: none;";
        newElement.innerText = name;
        newElement.setAttribute("value", name);
        newElement.onclick = function (event) { userClicked(event,connection,viewer,users,name); };
        $("#active-users")[0].appendChild(newElement);
        var newButton = document.createElement("button");
        newButton.className = "btn btn-info";
        newButton.style = "float:right;height:100%;display: inline-flex;text-align: center;font-size:x-small;z-index:999999";
        newButton.innerText = "Focus";
        newButton.onclick = function (event) { userDblClicked(event,viewer, users, name); };
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
                    scale:0.8
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
        },5000);
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

function userDblClicked(event,viewer, users, name) {
    if (users[name] === undefined) return;
    viewer.flyTo(users[name], { offset: new Cesium.HeadingPitchRange(0,-0.5,1000) });
}

function userClicked(event,connection, viewer, users, name) {
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