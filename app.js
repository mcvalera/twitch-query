
function Search() {
  this.query = null;
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
    var current = tmpl.getCurrentPage();

    if (offset) {
      offset = (current - 1) * 10;
    }

    var params = {
      q: this.query,
      limit: this.numResultsPerPage,
      client_id: 'swwh0dw19c4acl530o3ytjfopb63wb8',
      callback: 'tmpl.populateTemplate',
      offset: offset || 0
    }

    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = this.buildUri(params);

    var h = document.getElementsByTagName('script')[0];
    h.parentNode.insertBefore(s, h);
  };
}

function Template() {
  this.resultsTemplate = document.getElementById('result-template').innerHTML;
  this.resultsContainer = document.getElementById('results-container');
  this.numResultsContainer = document.getElementById('num-results');
  this.paginationContainer = document.getElementById('pagination');
  this.getCurrentPage = function() {
    return parseInt(this.paginationContainer.getAttribute('data-current-page'));
  }
  this.setCurrentPage = function(val) {
    this.paginationContainer.setAttribute('data-current-page', val);
  }
  this.populateTemplate = function(response) {
    var that = this;
    search.results = response;
    search.totalResults = response._total;
    console.log('SEARCH.RESULTS', search.results);
    var streams = response.streams;
    var results = that.resultsContainer;
    results.innerHTML = ''; // clear results to prevent appending next results to bottom

    that.setTotalResults();
    that.paginate();

    streams.forEach(function(stream) {
      var template = that.resultsTemplate;
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
  };
  this.setTotalResults = function() {
    this.numResultsContainer.innerHTML = 'Total results: ' + search.totalResults;
  };
  this.paginate = function() {
    this.paginationContainer.innerHTML = '<span id="prev"></span>' + this.getCurrentPage() + '/' + search.getNumPages() + '<span id="next"></span>';
    this.addListenerToPagination();
  }
  this.addListenerToPagination = function() {
    var that = this;
    document.getElementById('next').addEventListener('click', function(e) {
      var current = that.getCurrentPage();
      if (current < search.getNumPages()) {
        current += 1;
        tmpl.setCurrentPage(current);
        search.makeRequest(true);
      }
    });

    document.getElementById('prev').addEventListener('click', function(e) {
      var current = that.getCurrentPage();
      if (current > 1) {
        current -= 1;
        tmpl.setCurrentPage(current);
        search.makeRequest(true);
      }
    });
  }
}

var search = new Search();
var tmpl = new Template();

// make request either via clicking search button, or by pressing enter on input box
document.getElementById('search').onclick = function() {
  tmpl.setCurrentPage(1);
  search.makeRequest();
}

document.getElementById('query-input').addEventListener('keydown', function(e) {
  if (e.keyCode === 13) {
    tmpl.setCurrentPage(1);
    search.makeRequest();
  }
});

