
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
  var items = pulls.getElementsByClassName('list-browser-item');
  forEachElement(items, function(item) {
    if (item.className.indexOf('closed') != -1)
      return;
    var h3 = item.getElementsByTagName('h3')[0];
    var a = h3.getElementsByTagName('a')[0];
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
  var h3 = elem.getElementsByTagName('h3')[0];
  var a = h3.getElementsByTagName('a')[0];
  var tagElem = document.createElement('span');
  tagElem.setAttribute('class', 'state-indicator ' + tag);
  tagElem.textContent = tag.replace(/-/g, ' ');
  h3.insertBefore(tagElem, a);

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
    tags.map(function(tag) {
      return ('.CLASS { background-color: BG; color: FG }'
        .replace(/CLASS/, tag.name)
        .replace(/BG/, tag.background)
        .replace(/FG/, tag.foreground));
    }).join('');
  document.head.appendChild(style);
}
