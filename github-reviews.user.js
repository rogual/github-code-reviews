// ==UserScript==
// @match https://github.com/*
// ==/UserScript==

var accessToken = 'your access token here';

var style = document.createElement('style');
style.innerText = '.review-tag { border-radius: 3px; padding: 2px; margin-right: 1em; }';
style.innerText += '.ship-it { background-color: green; color: white }';
style.innerText += '.needs-review { background-color: orange; color: white }';
style.innerText += '.on-hold { background-color: gray; color: white }';
document.head.appendChild(style);

var pullLists = document.getElementsByClassName('pulls-list');
if (pullLists.length) {
  var pulls = pullLists[0];
  var items = pulls.getElementsByClassName('list-browser-item');
  for (var i=0; i<items.length; i++) {
    (function(i) {
      var item = items[i];
      var h3 = item.getElementsByTagName('h3')[0];
      var a = h3.getElementsByTagName('a')[0];
      var href = a.getAttribute('href');
      var bits = href.split('/');
      var user = bits[1];
      var repo = bits[2];
      var id = bits[4];
      getPullRequestComments(user, repo, id, function(comments) {
        if (comments.length) {
          var lastComment = comments[comments.length - 1].body.toLowerCase();
          console.log(lastComment);
          if (lastComment.indexOf('on hold') != -1) {
            tagListItem(item, 'on-hold');
          }
          else if (lastComment.indexOf('ship it') != -1) {
            tagListItem(item, 'ship-it');
          }
          else {
            tagListItem(item, 'needs-review');
          }
        }
        else {
          tagListItem(item, 'needs-review');
        }
      });
    })(i);
  }
}

function getPullRequestComments(user, repo, id, cb) {
  var rq = new XMLHttpRequest();
  var url = "https://api.github.com/repos/"+user+"/"+repo+"/issues/"+id +
            "/comments?access_token=" + accessToken;
  rq.open("GET", url, true);
  rq.onreadystatechange = function() {
    if (rq.readyState == 4) {
      cb(JSON.parse(rq.responseText));
    }
  };
  rq.send();
}

function tagListItem(elem, tag) {
  var h3 = elem.getElementsByTagName('h3')[0];
  var a = h3.getElementsByTagName('a')[0];
  var tagElem = document.createElement('span');
  tagElem.setAttribute('class', 'review-tag ' + tag);
  tagElem.innerText = tag.replace(/-/g, ' ');
  h3.insertBefore(tagElem, a);
}
