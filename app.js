
function Search(query) {
  this.query = query;
  this.numResultsPerPage = 10;
  this.results = null;
  this.totalResults = 0;
  this.getNumPages = function() {
    return Math.ceil(this.totalResults / this.numResultsPerPage);
  };
  this.buildUri = function(params) {
    var baseUri = 'https://api.twitch.tv/kraken';
    var endPoint = '/search/streams';
    return baseUri + endPoint + '?' + this.serialize(params);
  };
  this.serialize = function(params) {
      var query = [];
    for (var p in params) {
      query.push(p + '=' + params[p]);
    }
    return query.join('&');
  };
  this.makeRequest = function(offset) {
    this.query = document.getElementById('query-input').value;
    console.log('SEARCH.QUERY, ', this.query);
    var current = document.getElementById('pagination').getAttribute('data-current-page');

    if (offset) {
      offset = (current - 1) * 10;
    }

    var params = {
      q: this.query,
      client_id: 'swwh0dw19c4acl530o3ytjfopb63wb8',
      callback: 'populateTemplate',
      offset: offset || 0
    }

    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = this.buildUri(params);

    var h = document.getElementsByTagName('script')[0];
    h.parentNode.insertBefore(s, h);
  }
}

// init search with empty query
var search = new Search('');

function populateTemplate(response) {
  search.results = response;
  search.totalResults = response._total;
  console.log('SEARCH.RESULTS', search.results);
  var streams = response.streams;
  var results = document.getElementById('results-container');
  results.innerHTML = '';

  setTotalResults();
  pagination();

  streams.forEach(function(stream) {
    var template = document.getElementById('result-template').innerHTML;
    var data = {
      displayName: stream.channel.display_name,
      imgUrl: stream.preview.medium,
      gameName: stream.channel.game,
      numViews: stream.viewers,
      description: stream.channel.status
    }
    results.innerHTML += template.replace(/{(\w+)}/g, function($0, $1) {
        return data[$1];
    });
  });

}

function setTotalResults() {
  var el = document.getElementById('num-results');
  el.innerHTML = 'Total results: ' + search.totalResults;
}

function pagination() {
  var numPages = search.getNumPages();
  var el = document.getElementById('pagination');
  var current = el.getAttribute('data-current-page');

  el.innerHTML = '<span id="prev"></span>' + current + '/' + numPages + '<span id="next"></span>';
  addListenerToPagination(numPages);
}

// make request either via clicking search button, or by pressing enter on input box
document.getElementById('search').onclick = function() {
  search.makeRequest();
}

document.getElementById('query-input').addEventListener('keydown', function(e) {
  if (e.keyCode === 13) {
    search.makeRequest();
  }
});

// go through pagination results
function addListenerToPagination(numPages) {
  document.getElementById('next').addEventListener('click', function(e) {
    var pagination = document.getElementById('pagination');
    var current = parseInt(pagination.getAttribute('data-current-page'));
    if (current < numPages) {
      current += 1;
      pagination.setAttribute('data-current-page', current);
      search.makeRequest(true);
    }
  });

  document.getElementById('prev').addEventListener('click', function(e) {
    var pagination = document.getElementById('pagination');
    var current = parseInt(pagination.getAttribute('data-current-page'));
    if (current > 1) {
      current -= 1;
      pagination.setAttribute('data-current-page', current);
      search.makeRequest(true);
    }

  });
}

