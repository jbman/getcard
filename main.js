"use strict";

(function(window, document) {

  const KEY = "04df5d99a76b10643b60f941c955dc9a";

  // Compile HTML templates into JS template render functions
  const photoTemplate = Handlebars.compile(document.getElementById("photo-template").innerHTML);
  const messageTemplate = Handlebars.compile(document.getElementById("message-template").innerHTML);

  Handlebars.registerHelper('href', function(context, options) {
      if (context) {
        return new Handlebars.SafeString('<a href="' + context + '">' + options.fn(this) + '</a>');
      }
      else {
        return options.fn(this);
      }
    });

  const searchTextElement = document.getElementById("search-text");
  // Click search button when enter is hit in search text field
  searchTextElement.onkeypress = function(e) { onEnter(e, loadPhotosBasedOnSearchInput) };

  const searchButtonElement = document.getElementById("search-button");
  searchButtonElement.onclick = loadPhotosBasedOnSearchInput;

  function getTextDisplayElement() { return document.getElementById("text-display")} ;
  function getTextEditElement() { return document.getElementById("text-edit")} ;

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
        cardLink: "?photo=" + photo.id,
        photoLink: "https://www.flickr.com/photos/" + photo.owner + "/" + photo.id,
        photoTitle: photo.title,
        ownerSpanId: "owner-" + photo.id
      });
      insertHtml("images", photoHtml);
      loadInfo(photo.id, "showPhotoOwner");
    });

    // Show message if no photos found.
    if (json.photos.photo.length <= 0) {
      showMessage("Getcard is sorry, nothing found with " + searchTextElement.value + ".");
    }
  };

  function resolveOwner(flickrPhotoJson)
  {
    var owner = flickrPhotoJson.owner.realname;
    if (owner.length < 1) {
      return flickrPhotoJson.owner.username
    }
    return "by " + owner;
  }

  function showPhotoOwner(json) {
    document.getElementById("owner-"+ json.photo.id).innerHTML = resolveOwner(json.photo);
  }

  function showPhotoCard(json) {
    var photo = json.photo;
    var photoHtml = photoTemplate({
      fullSize: true,
      cardText: "Enter your message here",
      imgSrc: "https://farm" + photo.farm + ".staticflickr.com/" +
        photo.server + "/" + photo.id + "_" + photo.secret + "_" + "b.jpg",
      photoLink: photo.urls.url[0]._content,
      photoTitle: photo.title._content,
      photoOwner: resolveOwner(photo)
    });
    insertHtml("images", photoHtml);

    // Get card text from URL parameter
    var compressedText = getUrlParam("text");
    if(compressedText) {
      var text = LZString.decompressFromEncodedURIComponent(compressedText);
      getTextDisplayElement().innerHTML = text;
      getTextEditElement().value = text;
    }

    // Switch to text input on click
    var textDisplayElement = getTextDisplayElement();
    textDisplayElement.onclick = function() {
      this.style.display = 'none';
      var textEditElement = getTextEditElement();
      textEditElement.style.display = 'block';
      textEditElement.focus();
      var applyEditedTextFunction = function(e) { onEnter(e, function() {
        var text = textEditElement.value;
        textDisplayElement.innerHTML = text;
        textEditElement.style.display = 'none';
        textDisplayElement.style.display = 'block';
        window.history.replaceState(null, null, "?photo=" + photo.id + "&text=" + LZString.compressToEncodedURIComponent(text));
      })};
      textEditElement.onkeypress = applyEditedTextFunction;
    };
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
  function loadInfo(photoId, callbackName) {
    var data = {
      "method": "flickr.photos.getInfo",
      "format": "json",
      "api_key": KEY,
      "jsoncallback": callbackName,
      "photo_id": photoId
    }
    loadJsonP("https://api.flickr.com/services/rest", data);
  }

  /** Search for multiple photos by tag */
  function loadPhotos(tags) {
    showMessage("Hold on, Getcard loads you some photos...");

    // Update URL with the new search text to get a referencable URL and a URL history entry
    var title = "[_] with " + tags;
    document.title = title; // FF doesn't update title provided to pushState

    // License ids: https://www.flickr.com/services/api/explore/flickr.photos.licenses.getInfo
    // 1, "name": "Attribution-NonCommercial-ShareAlike License", "url": "https:\/\/creativecommons.org\/licenses\/by-nc-sa\/2.0\/"
    // 2, "name": "Attribution-NonCommercial License", "url": "https:\/\/creativecommons.org\/licenses\/by-nc\/2.0\/" },
    // 4, "name": "Attribution License", "url": "https:\/\/creativecommons.org\/licenses\/by\/2.0\/" },
    // 5, "name": "Attribution-ShareAlike License", "url": "https:\/\/creativecommons.org\/licenses\/by-sa\/2.0\/" },

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
      "license": "1,2,4,5",
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

  /** Load photo card based on URL parameter photo */
  function loadPhotoCardBasedOnUrl() {
    var photoId = getUrlParam("photo");
    loadInfo(photoId, "showPhotoCard");
  }

  /** Calls the right function based on parameters */
  function route() {
    if (getUrlParam("photo")) {
      loadPhotoCardBasedOnUrl();
    }
    else {
      loadPhotosBasedOnUrl();
    }
  }

  // Load photos on browser back navigation
  window.onpopstate = route;

  // Export functions for flickr API JSONP callback
  window.showPhotos = showPhotos;
  window.showPhotoOwner = showPhotoOwner;
  window.showPhotoCard = showPhotoCard;

  route();

})(window, document);
