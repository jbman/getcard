"use strict";

(function(window, document) {

  const KEY = "04df5d99a76b10643b60f941c955dc9a";

  // Compile HTML templates into JS template render functions
  const photoTemplate = Handlebars.compile(document.getElementById("photo-template").innerHTML);
  const messageTemplate = Handlebars.compile(document.getElementById("message-template").innerHTML);

  const searchTextElement = document.getElementById("search-text");
  // Click search button when enter is hit in search text field
  searchTextElement.onkeypress = (e) => { onEnter(e, loadPhotosBasedOnSearchInput) };

  const searchButtonElement = document.getElementById("search-button");
  searchButtonElement.onclick = loadPhotosBasedOnSearchInput;

  /* Inserts HTML at the given target element behind all children. */
  function insertHtml(elementId, html) {
      document.getElementById(elementId).insertAdjacentHTML("beforeend", html);
  }

  function showMessage(text) {
    removeAllChildren("message");
    insertHtml("message", messageTemplate({"message": text}));
  }

  function showPhotos(json) {
    // Clear existing message or photos
    removeAllChildren("message");
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
      insertHtml("images", photoHtml);
      loadInfo(photo.id);
    });

    // Show message if no photos found.
    if (json.photos.photo.length <= 0) {
      showMessage("Getcard is sorry, nothing found with " + searchTextElement.value + ".");
    }
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

  /**
   * Inserts a script so that a scriopt with a callback and the json data is returned.
   */
  function loadJsonP(url, data) {
    var parameters = Object.keys(data).map( key => { return key + "=" + data[key] })
    url = url + "?" + parameters.join("&");
    var scriptElement = document.createElement("script");
    scriptElement.setAttribute("src", url);
    var head = document.getElementsByTagName("head")[0];
    head.appendChild(scriptElement);
    // Removing the element right away did work in FF and Chrome
    head.removeChild(scriptElement);
  };

  // https://mashupguide.net/1.0/html/ch08s07.xhtml
  function loadInfo(photoId) {
    var data = {
      "method": "flickr.photos.getInfo",
      "format": "json",
      "api_key": KEY,
      "jsoncallback": "showPhotoOwner",
      "photo_id": photoId
    }
    loadJsonP("https://api.flickr.com/services/rest", data);
  }

  function loadPhotos(tags) {
    showMessage("Hold on, Getcard loads you some photos...");

    // Update URL with the new search text to get a referencable URL and a URL history entry
    var title = "[_] with " + tags;
    document.title = title; // FF doesn't update title provided to pushState

    var data = {
      "method": "flickr.photos.search",
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
    loadJsonP("https://api.flickr.com/services/rest", data);
  }

  /** Loads photos after based on the text in the search field  */
  function loadPhotosBasedOnSearchInput() {
      var tags = searchTextElement.value;
      // Add new page to browser history
      window.history.pushState(null, null, "?tags=" + tags);
      loadPhotos(tags);
  }

  function onEnter(e, onEnterFunction) {
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13'){
      onEnterFunction();
      return false;
    }
  }

  /** Loads photos based on URL parameter "tags" */
  function loadPhotosBasedOnUrl() {
    var tags = getUrlParam("tags") || "kitten";
    // Fill in search value based on URL parameter
    searchTextElement.value = tags;
    loadPhotos(tags);
  }

  // Load photos on browser back navigation
  window.onpopstate = loadPhotosBasedOnUrl;

  // Export functions for flickr API JSONP callback
  window.showPhotos = showPhotos;
  window.showPhotoOwner = showPhotoOwner;

  loadPhotosBasedOnUrl();

})(window, document);
