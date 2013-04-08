// ==UserScript==
// @name GitHub Code Reviews
// @author Robin Allen
// @match https://github.com/*
// @version 1.1
// ==/UserScript==

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

function getOrgRepos(org, cb) {
  var url = "https://api.github.com/orgs/"+org+"/repos" +
            "?access_token=" + accessToken;
  getJSON(url, cb);
}

function getPullRequests(user, repo, cb) {
  var url = "https://api.github.com/repos/"+user+"/"+repo+"/pulls" +
            "?access_token=" + accessToken;
  getJSON(url, cb);
}

function getOrgPullRequests(org, cb) {
  getOrgRepos(org, function(repos) {
    function iter(pulls, i) {
      if (i == repos.length)
        return cb(pulls);
      var repo = repos[i];
      var user = repo.owner.login;
      getPullRequests(user, repo.name, function(repoPulls) {
        iter(pulls.concat(repoPulls), i + 1);
      });
    }
    iter([], 0);
  });
}

function getPullRequestComments(user, repo, id, cb) {
  getComments(user, repo, id, "issues", function(issueComments) {
    getComments(user, repo, id, "pulls", function(pullComments) {
      var comments = issueComments.concat(pullComments);
      comments.sort(function(a, b) {
        var ak = a.created_at;
        var bk = b.created_at;
        if (ak < bk) return -1;
        if (ak > bk) return 1;
        return 0;
      });
      cb(comments);
    });
  });
}

function getComments(user, repo, id, type, cb) {
  var url = "https://api.github.com/repos/"+user+"/"+repo+"/"+type+"/"+id +
            "/comments?access_token=" + accessToken;
  getJSON(url, cb);
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

var accessToken = localStorage.getItem('accessToken');
if (!accessToken) {
    accessToken = prompt("Please enter your GitHub access token.");
    localStorage.setItem('accessToken', accessToken);
}

var tags = table('name', 'background', 'foreground', 'pattern');

tags.add('on-hold',    'gray',  'white', /on hold|hold off|#onhold|#holdit/);
tags.add('needs-work', '#921',  'white', /please|#needswork/);
tags.add('ship-it',    'green', 'white', /ship it|#shipit/);

tags.add('needs-review', '#f80', 'white', new RegExp([
    '(needs|ready for|awaiting|waiting for) (re?)review',
    'can one of the admins verify this patch',
    'addressed',
    '#needsreview'
].join('|')));

// -- Config section -----------------------------------------------------------

var getExtraLinks = function() { return []; };

// -- End config section -------------------------------------------------------


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
  var items = pulls.getElementsByClassName('js-list-browser-item');
  forEachElement(items, function(item) {
    if (item.className.indexOf('closed') != -1)
      return;
    var h4 = item.getElementsByTagName('h4')[0];
    var a = h4.getElementsByTagName('a')[0];
    var href = a.getAttribute('href');
    var bits = href.split('/');
    var user = bits[1];
    var repo = bits[2];
    var id = bits[4];
    var name = a.textContent;
    var extraLinks = getExtraLinks(user, repo, id, name);
    getTag(user, repo, id, function(tag) {
      tagListItem(item, tag, extraLinks);
    });
  });
}


function tagListItem(elem, tag, extraLinks) {
  var ul = elem.getElementsByTagName('ul')[0];
  var firstItem = ul.getElementsByTagName('li')[0];

  var tagElem = document.createElement('li');
  tagElem.setAttribute('class', 'state-indicator ' + tag);
  tagElem.textContent = tag.replace(/-/g, ' ');
  ul.insertBefore(tagElem, firstItem);

  if (extraLinks.length) {
    var linksElem = document.createElement('div');
    linksElem.className = 'extra-links';
    extraLinks.forEach(function(link) {
      var text = link[0];
      var url = link[1];
      var linkElem = document.createElement('a');
      linkElem.textContent = text;
      linkElem.setAttribute('href', url);
      linksElem.appendChild(linkElem);
    });
    elem.appendChild(linksElem);
  }
}

function addCSS() {
  var style = document.createElement('style');
  style.textContent =
    '.extra-links { position: absolute; right: 10px; top: 35px; }' +
    '.extra-links { font-size: 11px; }' +
    '.state-indicator { font-size: 11px; padding: 0px 5px 0px 5px; font-weight: normal; }' +
    tags.map(function(tag) {
      return ('.CLASS { background-color: BG; color: FG }'
        .replace(/CLASS/, tag.name)
        .replace(/BG/, tag.background)
        .replace(/FG/, tag.foreground));
    }).join('');
  document.head.appendChild(style);
}
