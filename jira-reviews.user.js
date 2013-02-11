// ==UserScript==
// @name JIRA Code Reviews
// @author Robin Allen
// @match https://*.atlassian.net/secure/RapidBoard.jspa?*
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

var tags = table('name', 'background', 'light', 'foreground', 'pattern');

tags.add('on-hold',    'gray',  'white', 'white', /on hold|hold off|#onhold|#holdit/);
tags.add('needs-work', '#921',  '#fee', 'white', /please|#needswork/);
tags.add('ship-it',    'green', '#efe', 'white', /ship it|#shipit/);

tags.add('needs-review', '#f80', '#ffe', 'white', new RegExp([
    '(needs|ready for|awaiting|waiting for) (re?)review',
    'can one of the admins verify this patch',
    'addressed',
    '#needsreview'
].join('|')));

var orgName = localStorage.getItem('organization');
if (!orgName) {
    orgName = prompt("Please enter your GitHub organization name");
    localStorage.setItem('organization', orgName);
}

addCSS();
maybeUpdate();

function maybeUpdate() {
  if (needsUpdate()) {
    update(wait);
  }
  else {
    wait();
  }
}

function wait() {
  setTimeout(maybeUpdate, 1000);
}

function needsUpdate() {
  var cards = document.getElementsByClassName('ghx-issue');
  for (var i=0; i<cards.length; i++) {
    var card = cards[i];
    if (!hasClass(card, 'code-reviews-loaded'))
      return true;
  }
  return false;
}

function update(cb) {
  getOrgPullRequests(orgName, function(pulls) {
    updateWithPulls(pulls, cb);
  });
}

function findPull(pulls, issueName) {
  for (var i=0; i<pulls.length; i++) {
    var pull = pulls[i];
    if (pull.title.toLowerCase().indexOf(issueName.toLowerCase()) != -1) {
      return pull;
    }
  }
}

function updateWithPulls(pulls, cb) {
  var cards = document.getElementsByClassName('ghx-issue');

  iter(0);

  function iter(i) {

    if (i == cards.length)
      return cb();

    var card = cards[i];

    var links = card.getElementsByClassName('js-detailview');
    if (links.length) {
      var link = links[0];
      var issueName = link.textContent;
      var pull = findPull(pulls, issueName);
      addClass(card, 'code-reviews-loaded');

      if (pull) {
        var repo = pull.base.repo;
        getTag(repo.owner.login, repo.name, pull.number, function(tag) {
          addClass(card, 'code-review');
          addClass(card, tag);
          var elem = document.createElement('div');
          addClass(elem, 'code-review-tag');
          addClass(elem, tag);
          var link = document.createElement('a');
          link.setAttribute('href', pull.html_url);
          link.textContent = tag.replace(/-/g, ' ');
          elem.appendChild(link);
          card.insertBefore(elem, card.firstChild);

          iter(i + 1);
        });
      }
      else {
        iter(i + 1);
      }
    }
    else {
      iter(i + 1);
    }
  }
}

function addCSS() {
  var style = document.createElement('style');
  style.textContent =
    '.ghx-issue.code-review .ghx-type { top: 20px; }' +
    '.ghx-issue.code-review .ghx-flags { top: 41px; }' +
    '.ghx-issue.code-review .ghx-key { margin-top: 16px; }' +
    '.ghx-issue.code-review { height: 86px; }' +
    '.ghx-issue.code-review .ghx-grabber{ height: 85px; }' +
    '.ghx-issue.code-review .ghx-grabber::after { height: 81px; }' +
    '.code-review-tag { position: absolute; left: 0; top: -1px; width: 100%; }' +
    '.code-review-tag a { color: white !important; margin-left: 16px; }' +
    tags.map(function(tag) {
      return (
        ('.code-review-tag.CLASS { background-color: BG; color: FG }' +
         '.ghx-issue.CLASS { background-color: LIGHT }')
        .replace(/CLASS/g, tag.name)
        .replace(/BG/, tag.background)
        .replace(/FG/, tag.foreground)
        .replace(/LIGHT/, tag.light));
    }).join('');
  document.head.appendChild(style);
}
