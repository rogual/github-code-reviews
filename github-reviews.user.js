// ==UserScript==
// @name GitHub Code Reviews
// @author Robin Allen
// @match https://github.com/*
// ==/UserScript==

var accessToken = 'your access token here';

var tags = table('name', 'background', 'foreground', 'pattern');

tags.add('on-hold',    'gray',  'white', /on hold|hold off|#onhold|#holdit/);
tags.add('needs-work', '#921',  'white', /please|#needswork/);
tags.add('ship-it',    'green', 'white', /ship it|#shipit/);

tags.add('needs-review', '#f80', 'white',
  /(needs|ready for|awaiting|waiting for) (re?)review|addressed|#needsreview/);

addCSS();
setInterval(maybeUpdate, 1000);
maybeUpdate();

function maybeUpdate() {
  var pulls = getPulls();
  if (pulls && !hasClass(pulls, 'code-reviews-loaded')) {
    update(pulls);
  }
}

function getPulls() {
  var pullLists = document.getElementsByClassName('pulls-list');
  if (pullLists.length) {
    return pullLists[0];
  }
}

function update(pulls) {
  addClass(pulls, 'code-reviews-loaded');
  var items = pulls.getElementsByClassName('list-browser-item');
  forEachElement(items, function(item) {
    var h3 = item.getElementsByTagName('h3')[0];
    var a = h3.getElementsByTagName('a')[0];
    var href = a.getAttribute('href');
    var bits = href.split('/');
    var user = bits[1];
    var repo = bits[2];
    var id = bits[4];
    getTag(user, repo, id, function(tag) {
      tagListItem(item, tag);
    });
  });
}

function getTag(user, repo, id, cb) {
  getPullRequestComments(user, repo, id, function(comments) {
    if (comments.length) {
      var lastComment = comments[comments.length - 1];
      var text = lastComment.body.toLowerCase();

      var useTag;
      tags.forEach(function(tag) {
        if (!useTag && tag.pattern && tag.pattern.test(text))
          useTag = tag.name;
      });

      if (useTag) {
        cb(useTag);
      }
      else {
        getPullRequest(user, repo, id, function(pull) {
          if (pull.user.id == lastComment.user.id) {
            cb('needs-review');
          }
          else {
            cb('needs-work');
          }
        });
      }
    }
    else {
      cb('needs-review');
    }
  });
}

function getJSON(url, cb) {
  var rq = new XMLHttpRequest();
  rq.open("GET", url, true);
  rq.onreadystatechange = function() {
    if (rq.readyState == 4) {
      cb(JSON.parse(rq.responseText));
    }
  };
  rq.send();
}

function getPullRequest(user, repo, id, cb) {
  var url = "https://api.github.com/repos/"+user+"/"+repo+"/pulls/"+id +
            "?access_token=" + accessToken;
  getJSON(url, cb);
}

function getPullRequestComments(user, repo, id, cb) {
  var url = "https://api.github.com/repos/"+user+"/"+repo+"/issues/"+id +
            "/comments?access_token=" + accessToken;
  getJSON(url, cb);
}

function tagListItem(elem, tag) {
  var h3 = elem.getElementsByTagName('h3')[0];
  var a = h3.getElementsByTagName('a')[0];
  var tagElem = document.createElement('span');
  tagElem.setAttribute('class', 'review-tag ' + tag);
  tagElem.innerText = tag.replace(/-/g, ' ');
  h3.insertBefore(tagElem, a);
}

function addClass(elem, className) {
  elem.setAttribute('class', elem.getAttribute('class') + ' ' + className);
}

function hasClass(elem, className) {
  return elem.getAttribute('class').indexOf(className) != -1;
}

function forEachElement(elems, cb) {
  for (var i=0; i<elems.length; i++)
    cb(elems[i]);
}

function addCSS() {
  var style = document.createElement('style');
  style.innerText =
    '.review-tag { border-radius: 3px; padding: 2px; margin-right: 1em; }' +
    tags.map(function(tag) {
      return ('.CLASS { background-color: BG; color: FG }'
        .replace(/CLASS/, tag.name)
        .replace(/BG/, tag.background)
        .replace(/FG/, tag.foreground));
    }).join('');
  document.head.appendChild(style);
}

function table() {
  var propertyNames = Array.prototype.slice.call(arguments);
  var result = [];
  result.add = function() {
    var item = {};
    for (var i=0; i<arguments.length; i++)
      item[propertyNames[i]] = arguments[i];
    result.push(item);
  };
  return result;
}
