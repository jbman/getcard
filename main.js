"use strict";

const KEY = "04df5d99a76b10643b60f941c955dc9a";

function jsonFlickrApi(json) {
  json.photos.photo.forEach(function(photo, i) {
    var div = $("<div />")
      .addClass("photoframe")
      .appendTo("#images");
    var t_url = "https://farm" + photo.farm + ".staticflickr.com/" +
      photo.server + "/" + photo.id + "_" + photo.secret + "_" + "n.jpg";
    var p_url = "https://www.flickr.com/photos/" + photo.owner + "/" + photo.id;
    $("<img />", {
        alt: photo.title,
        src: t_url
    }).appendTo(div);
    $("<a />", {
        id: "link-" + photo.id,
        class: "photolink",
        href: p_url,
        text: photo.title,
        target: "_blank"
    }).appendTo(div);
    $("<span />", {
        id: "owner-" + photo.id,
        class: "photoowner",
    }).appendTo(div);
    loadInfo(photo.id)
  });
};

function infoLoaded(json) {
  var owner = json.photo.owner.realname;
  if (owner.length < 1) {
    owner = json.photo.owner.username
  }
  $("#owner-"+ json.photo.id).text("by " + owner);
}

function getUrlParam(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return false ;
}

// https://mashupguide.net/1.0/html/ch08s07.xhtml
function loadInfo(photoId) {
  $.ajax({
    url: 'https://api.flickr.com/services/rest/?method=flickr.photos.getInfo',
    dataType: 'jsonp',
    data: {
      "format": "json",
      "api_key": KEY,
      "jsoncallback": "infoLoaded",
      "photo_id": photoId
    }
  });

}

function loadImages() {
  var data = {
    "api_key": KEY,
    "media": "photos",
    "text": text,
    "tags": tags,
    "styles": "depthoffield",
    //"styles": "pattern",
    "tag_mode": "all",
    "per_page": 3,
    "license": "1,2,4,5,7",
    "sort": "interestingness-desc",
    "format": "json"
  };
  var text = getUrlParam("text");
  if (text) {
    data.text = text;
  }
  var tags = getUrlParam("tags");
  if (tags) {
    data.tags = tags;
  }
  $.ajax({
    url: 'https://api.flickr.com/services/rest/?method=flickr.photos.search',
    dataType: 'jsonp',
    data: data
  });
}

window.onload = loadImages;
