// Emotes via twitchemotes.com
var globalEmotes = '//twitchemotes.com/api_cache/v2/global.json';
var emoteTemplate = '//static-cdn.jtvnw.net/emoticons/v1/{image_id}/1.0';

// Emotes via BetterTTV
var betterEmotes = '//api.betterttv.net/emotes'

// Local flags that helps to synchronize async parsing of emotes without Promises
var globalLoaded = false;
var betterLoaded = false;

// Associative array for regex and image URL
var imageMap = [];

(function() {
  loadGlobalEmotes();
  loadBetterEmotes();
})();

// Ensure that replacement only happens after emotes are successfully parsed
var asyncReplaceEvent = document.createEvent('Event');
asyncReplaceEvent.initEvent('replaceRegex', true, true);

// Replace matching regex with actual emotes
document.addEventListener('replaceRegex', function(e) {
  if (globalLoaded && betterLoaded) {
    processNode(document.body);
  }
}, false);

// Idea and algorithm credits to popcorncolonel
function processNode(node) {
  var childNode, nextNode;
  switch (node.nodeType) {
    case 1:
    case 9:
    case 11:
      childNode = node.firstChild;
      while (childNode) {
        nextNode = childNode.nextSibling;
        processNode(childNode);
        childNode = nextNode;
      }
    case 3:
      replaceRegex(node);
      break
  }
}


// Idea and algorithm credits to popcorncolonel
document.addEventListener('DOMNodeInserted', dynamicReplaceRegex, false);

function dynamicReplaceRegex(evt) {
  var element = evt.target;
  if (element && element.tagName && element.tagName.toLowerCase() == 'div') {
    if (element.parentElement.className.indexOf('tweet-box') > -1 ||
      element.parentElement.className.indexOf('normalizer') > -1)
      return;
  }

  if (element && (!element.className ||
      ((element.className && element.className.indexOf && element.className.indexOf('tipsy') == -1 ||
          (location && location.hostname && location.hostname.indexOf && location.hostname.indexOf('twitch.tv') == -1)) &&
        element.className.indexOf && element.className.indexOf('chat-line') == -1)
    )) {
    processNode(element);
  }
}

function replaceRegex(node) {
  var value = node.nodeValue;
  if (value) {
    var parentNode = node.parentElement;
    var split = value.split(/\b/);
    var len = split.length;
    var buffer = '';
    var found = false;

    for (var i = 0; i < len; i++) {
      word = split[i];
      if (word in imageMap && typeof imageMap[word] === 'string') {
        var url = imageMap[word];
        found = true;
        img = document.createElement('img');
        img.src = url;
        img.title = word;
        img.alt = word;
        img.style.display = 'inline';
        img.style.width = 'auto';
        img.style.overflow = 'hidden';
        txt = document.createTextNode(buffer);
        parentNode.insertBefore(txt, node);
        parentNode.insertBefore(img, node);
        buffer = '';
      } else {
        buffer += word;
        if (i == len - 1) {
          if (buffer != node.nodeValue) {
            txt = document.createTextNode(buffer);
            parentNode.insertBefore(txt, node);
            node.nodeValue = '';
          }
        }
      }
    }
  } else {
    return;
  }

  if (buffer == '') {
    node.nodeValue = '';
  }
}

function loadGlobalEmotes() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', globalEmotes, true);
  xhr.send();
  xhr.onload = function() {
    if (xhr.status === 200) {
      var reply = JSON.parse(xhr.responseText);
      var emotes = reply.emotes;
      for (var regex in emotes) {
        imageMap[regex] = emoteTemplate.replace(/{image_id}/, emotes[regex].image_id);
      }
      globalLoaded = true;
      document.dispatchEvent(asyncReplaceEvent);
    }
  }
}

function loadBetterEmotes() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', betterEmotes, true);
  xhr.send();
  xhr.onload = function() {
    if (xhr.status === 200) {
      var reply = JSON.parse(xhr.responseText);
      var emotes = reply.emotes;
      for (var i = 0; i < emotes.length; i++) {
        var regex = emotes[i].regex;
        var url = emotes[i].url;
        imageMap[regex] = url;
      }
      betterLoaded = true;
      document.dispatchEvent(asyncReplaceEvent);
    }
  }
}
