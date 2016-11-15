
function Search() {
  this.query = null;
  this.numResultsPerPage = 10;
  this.results = null;
  this.totalResults = 0;
  this.getQuery = function() {
    this.query = document.getElementById('query-input').value;
    return this.query;
  }
  this.isQueryValid = function() {
    if (this.query.length > 0) { return true; }
    return false;
  }
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
    var query = this.getQuery();
    var invalidInputEl = document.getElementById('invalid-input');
    if (this.isQueryValid()) {
      if (invalidInputEl.classList.contains('show')) {
        invalidInputEl.className = '';
      }
      tmpl.showResultsSection();
      var current = tmpl.getCurrentPage();

      if (offset) {
        offset = (current - 1) * 10;
      }

      var params = {
        q: query,
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
    } else {
      tmpl.hideResultsSection();
      tmpl.clearResultsContainer();
      invalidInputEl.className += 'show';
      throw new Error('query invalid');
    }

  };
}

function Template() {
  this.resultsSection = document.getElementById('results');
  this.resultsContainer = document.getElementById('results-container');
  this.resultsTemplate = document.getElementById('result-template').innerHTML;
  this.numResultsContainer = document.getElementById('num-results');
  this.paginationContainer = document.getElementById('pagination');
  this.showResultsSection = function() {
    this.resultsSection.className = 'show';
  }
  this.hideResultsSection = function() {
    var section = this.resultsSection;
    if (section.classList.contains('show')) { section.className = ''; }
  }
  this.clearResultsContainer = function() {
    this.resultsContainer.innerHTML = '';
  }
  this.getCurrentPage = function() {
    return parseInt(this.paginationContainer.getAttribute('data-current-page'));
  }
  this.setCurrentPage = function(val) {
    this.paginationContainer.setAttribute('data-current-page', val);
  }
  this.populateTemplate = function(response) {
    var that = this;
    search.totalResults = response._total;
    that.setTotalResults();
    that.clearResultsContainer();
    if (search.totalResults > 0) {
      search.results = response;
      var streams = response.streams;

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
        that.resultsContainer.innerHTML += template.replace(/{(\w+)}/g, function($0, $1) {
            return data[$1];
        });
      });
    } else {
      that.clearPagination();
    }
  };
  this.setTotalResults = function() {
    this.numResultsContainer.innerHTML = 'Total results: ' + search.totalResults;
  };
  this.paginate = function() {
    this.paginationContainer.innerHTML = '<span id="prev"></span>' + this.getCurrentPage() + '/' + search.getNumPages() + '<span id="next"></span>';
    this.addListenerToPagination();
  }
  this.clearPagination = function() {
    this.paginationContainer.innerHTML = '';
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

