var map,
  infowindow,
  marker,
  locationId,
  hasNewPlace = false,
  restaurantList = [];
markers = [];
markersRestaurantList = [];
// restaurantList คือตัวแปรเก็บสถานที่กับร้านอาหารที่เคยค้นหาไปแล้ว
// locationId คือตัวแปรที่เอาไว้เก็บ placeid ที่ได้มาจาก google ใช้สำหรับเช็คสถานที่ซ้ำในฟังก์ชั่น checkDuplicateSearchResult()
// hasNewPlace คือตัวแปรเอาไว้เช็คว่าสถานที่ที่เราค้นหาเป็นสถานที่ใหม่หรือไม่

//กำหนดค่า default ของ map กับ searchbox
function createMap() {
  document.getElementById("search-input").value = "Bang sue";
  var input = document.getElementById("search-input");
  var searchBox = new google.maps.places.SearchBox(input);
  map = new google.maps.Map(document.getElementById("map"), {
    center: {
      lat: 13.8234866,
      lng: 100.5081204,
    },
    zoom: 14, //ระยะการซูม ตัวเลขยิ่งมากจะเห็น marker ใกล้ขึ้น
  });

  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces(); //ดึงข้อมูลของสถานที่ที่เราค้นหา
    locationId = places[0].place_id;
    hasNewPlace = true;
    map.setCenter(
      new google.maps.LatLng(
        places[0].geometry.location.lat(),
        places[0].geometry.location.lng()
      )
    ); //กำหนดค่า Center ของแผนที่ที่เราจะแสดงโดยใช้ lat long ของสถานที่ที่เราค้นหาเป็น base

    checkDuplicateSearchResult();
  });

  setRequest();
}

// ฟังก์ชั่นเช็ตสถานที่ค้นหานั้นมีซ้ำแล้วหรือยัง?
function checkDuplicateSearchResult() {
  if (restaurantList.length > 0) {
    for (var i = 0; i < restaurantList.length; i++) {
      if (restaurantList[i].id == locationId) {
        var existRestaurant = restaurantList[i].placeList;
        createMarker(existRestaurant);
        renderRestaurantList(existRestaurant);
        break;
      } else {
        setRequest();
      }
    }
  } else {
    setRequest();
  }
}

// ฟังก์ชั่นนี้ใช้สำหรับ Set Request ในการดึงข้อมูลร้านอาหารที่อยู่ใกล้เคียงจาก Google
function setRequest() {
  var request = {
    location: map.getCenter(),
    radius: 10000, //กำหนดรัศมีที่อยู่ในระยะของหมุด ตัวเลขยิ่งมากจะเห็นร้านอาหารมากขึ้น
    types: ["restaurant"], //ชนิดของร้านที่เราต้องการจะค้นหา
  };

  var service = new google.maps.places.PlacesService(map); //กำหนด service ในการขอข้อมูล
  service.nearbySearch(request, callback); //ใช้ service ค้นหาข้อมูบสถานที่ที่อยู่ใกล้ แล้วเอา response ที่ได้ส่งไปยังฟังก์ชั่น callback
}

function callback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    //ถ้า google ส่ง response กลับมามีข้อมูลร้านอาหารจริง
    $("#count").html(results.length);
    createMarker(results);
    renderRestaurantList(results);
  } else {
    $("#count").html(0);
    $("#place-list").append(
      "<div class='p-3 border-0 text-center'><p class='font-weight-bold m-0'>ไม่พบข้อมูล</p></div>"
    );
  }

  //เช็คอีกรอบว่าสถานที่ใหม่เพิ่มเข้าไป restaurantList หรือยัง
  for (var j = 0; j < restaurantList.length; j++) {
    if (restaurantList[j].id == locationId) {
      hasNewPlace = false;
    }
  }

  if (hasNewPlace) {
    restaurantList.push({
      id: locationId,
      placeList: results,
    });
  }
}

// ฟังก์์ชั่นสร้างหมุด
function createMarker(place) {
  infowindow = new google.maps.InfoWindow();

  //กำหนดหมุดตาม lat long ของแต่ละร้านอาหาร
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }

  for (var i = 0; i < place.length; i++) {
    marker = new google.maps.Marker({
      map: map,
      position: place[i].geometry.location,
      title: place[i].name,
    });

    //ฟังก์ชั่นกำหนดว่าถ้าคลิกที่หมุดให้แสดง infowindow ของแต่ละหมุด
    google.maps.event.addListener(
      marker,
      "click",
      (function (marker, i) {
        return function () {
          infowindow.close();
          //กำหนดสิ่งที่จะแสดงใน infowindow (infowindow คือ popup ที่แสดงขึ้นมาว่าเรากดหมุด)
          infowindow.setContent(
            '<div id="content">' +
              '<div id="siteNotice">' +
              "</div>" +
              '<h3 id="firstHeading" class="firstHeading">' +
              place[i].name +
              "</h3>" +
              '<div id="bodyContent">' +
              "<p>" +
              place[i].vicinity +
              "</p>" +
              "</div>" +
              "</div>"
          );
          infowindow.open(map, marker);
        };
      })(marker, i)
    );

    markers.push(marker);
    markersRestaurantList.push({
      id: place[i].place_id,
      name: place[i].name,
    });
  }
}

// ฟังก์์ชั่น list ข้อมูลของร้านอาหาร
function renderRestaurantList(place) {
  $("#place-list").html("");
  for (var i = 0; i < place.length; i++) {
    $("#place-list").append(
      "<div class='p-3 pointer' onclick='triggerMarker(\"" +
        place[i].place_id +
        "\")'><p class='font-weight-bold pointer' >" +
        place[i].name +
        "</p><p class='m-0'>" +
        place[i].vicinity +
        "</p></div>"
    );
  }
}

//ฟังก์ชั่นกดที่ div รายชื่อร้านอาหารเพื่อ trigger marker แสดง infowindow เหมือนกด click marker ตรงๆ
function triggerMarker(id) {
  for (var i = 0; i < markersRestaurantList.length; i++) {
    if (markersRestaurantList[i].id == id) {
      google.maps.event.trigger(markers[i], "click");
    }
  }
}
