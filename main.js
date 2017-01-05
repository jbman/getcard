"use strict";

(function(window, document) {

  const KEY = "04df5d99a76b10643b60f941c955dc9a";

  // Compile HTML templates into JS template render functions
  var templateScript = document.getElementById("photo-template").innerHTML;
  var photoTemplate = Handlebars.compile(templateScript);
  var searchTextElement = document.getElementById("search-text");
  var searchButtonElement = document.getElementById("search-button")

  function showPhotos(json) {
    // Clear existing photo elements
    removeAllChildren("images");
    // Show photos
    json.photos.photo.forEach(function(photo, i) {
      var photoHtml = photoTemplate({
        imgSrc: "https://farm" + photo.farm + ".staticflickr.com/" +
          photo.server + "/" + photo.id + "_" + photo.secret + "_" + "n.jpg",
        photoLink: "https://www.flickr.com/photos/" + photo.owner + "/" + photo.id,
        photoTitle: photo.title,
        ownerSpanId: "owner-" + photo.id,
      });
      document.getElementById("images").insertAdjacentHTML("beforeend", photoHtml);
      loadInfo(photo.id);
    });
  };

  function showPhotoOwner(json) {
    var owner = json.photo.owner.realname;
    if (owner.length < 1) {
      owner = json.photo.owner.username
    }
    document.getElementById("owner-"+ json.photo.id).innerHTML = "by " + owner;
  }

  function removeAllChildren(elementId)
  {
    var node = document.getElementById(elementId);
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function getUrlParam(variable)
  {
         var query = window.location.search.substring(1);
         var vars = query.split("&");
         for (var i=0;i<vars.length;i++) {
                 var pair = vars[i].split("=");
                 if(pair[0] == variable){
                   var value = pair[1];
                   if (value.length > 0)
                     return value;
                 }
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
        "jsoncallback": "showPhotoOwner",
        "photo_id": photoId
      }
    });

  }

  function loadPhotos(tags) {
    var data = {
      "api_key": KEY,
      "media": "photos",
      "tags": tags,
      // "text": text
      // "styles": "depthoffield",
      // "styles": "pattern",
      "tag_mode": "all",
      "per_page": 3,
      "license": "1,2,4,5,7",
      "sort": "interestingness-desc",
      "format": "json",
      "jsoncallback": "showPhotos",
    };
    $.ajax({
      url: 'https://api.flickr.com/services/rest/?method=flickr.photos.search',
      dataType: 'jsonp',
      data: data
    });
  }

  function onSearchButtonClick() {
      var searchTextValue = searchTextElement.value;
      // Update URL with the new search text to get a referencable URL and a URL history entry
      var title = "[_] with " + searchTextValue;
      window.history.pushState(null, searchTextValue, "?tags=" + searchTextValue);
      document.title = title; // FF doesn't updat title provided to pushState
      loadPhotos(searchTextValue);
  }

  searchButtonElement.onclick = onSearchButtonClick;

  // Click search button when enter is hit in search text field
  searchTextElement.onkeypress = function(e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13'){
      onSearchButtonClick();
      return false;
    }
  }

  // Export callback functions
  window.showPhotos = showPhotos;
  window.showPhotoOwner = showPhotoOwner;

  // When page is loaded: Load photos based on URL parameter
  var tags = getUrlParam("tags") || "kitten";
  searchTextElement.value = tags;
  loadPhotos(tags);
})(window, document);
