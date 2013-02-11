
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
