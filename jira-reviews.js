
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
