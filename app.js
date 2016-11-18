
var search = (function() {
  var query = null;
  var numResultsPerPage = 10;
  var _isQueryValid = function() {
    if (query.length > 0) { return true; }
    return false;
  };
  var _buildUri = function(params) {
    var baseUri = 'https://api.twitch.tv/kraken';
    var endPoint = '/search/streams';
    return baseUri + endPoint + '?' + _serialize(params);
  };
  var _serialize = function(params) {
    var queryStr = [];
    for (var p in params) {
      queryStr.push(p + '=' + params[p]);
    }
    return queryStr.join('&');
  }

  return {
    results: null,
    totalResults: 0,
    getQuery: function() {
      query = document.getElementById('query-input').value;
      return query;
    },
    getNumPages: function() {
      return Math.ceil(this.totalResults / numResultsPerPage);
    },
    makeRequest: function(offset) {
      this.getQuery();
      var invalidInputEl = document.getElementById('invalid-input');
      if (_isQueryValid()) {
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
          limit: numResultsPerPage,
          client_id: 'swwh0dw19c4acl530o3ytjfopb63wb8', // according to Twitch Doc: 'Client IDs are public and can be shared (e.g. embedded in the source of a web page)''
          callback: 'tmpl.populateTemplate',
          offset: offset || 0
        }

        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = _buildUri(params);

        document.head.appendChild(s);
      } else {
        tmpl.hideResultsSection();
        tmpl.clearResultsContainer();
        invalidInputEl.className = 'show';
        throw new Error('query invalid');
      }

    }
  }
})();

var tmpl = (function() {
  var resultsSection = document.getElementById('results');
  var resultsContainer = document.getElementById('results-container');
  var resultsTemplate = document.getElementById('result-template').innerHTML;
  var numResultsContainer = document.getElementById('num-results');
  var paginationContainer = document.getElementById('pagination');

  return {
    showResultsSection: function() {
      resultsSection.className = 'show';
    },
    hideResultsSection: function() {
      var section = resultsSection;
      if (section.classList.contains('show')) { section.className = ''; }
    },
    clearResultsContainer: function() {
      resultsContainer.innerHTML = '';
    },
    getCurrentPage: function() {
      return parseInt(paginationContainer.getAttribute('data-current-page'));
    },
    setCurrentPage: function(val) {
      paginationContainer.setAttribute('data-current-page', val);
    },
    populateTemplate: function(response) {
      var that = this;
      search.totalResults = response._total;
      that.setTotalResults();
      that.clearResultsContainer();
      if (search.totalResults > 0) {
        search.results = response;
        var streams = response.streams;

        that.paginate();

        streams.forEach(function(stream) {
          var template = resultsTemplate;
          var data = {
            streamUrl: stream.channel.url,
            displayName: stream.channel.display_name,
            imgUrl: stream.preview.medium,
            gameName: stream.channel.game,
            numViews: stream.viewers,
            description: stream.channel.status
          }
          resultsContainer.innerHTML += template.replace(/{(\w+)}/g, function($0, $1) {
              return data[$1];
          });
        });
      } else {
        that.clearPagination();
      }
    },
    setTotalResults: function() {
      numResultsContainer.innerHTML = 'Total results: ' + search.totalResults;
    },
    paginate:function() {
      paginationContainer.innerHTML = '<span id="prev"></span>' + this.getCurrentPage() + '/' + search.getNumPages() + '<span id="next"></span>';
      this.addListenerToPagination();
    },
    clearPagination: function() {
      paginationContainer.innerHTML = '';
    },
    addListenerToPagination: function() {
      var that = this;
      document.getElementById('next').addEventListener('click', function(e) {
        var current = that.getCurrentPage();
        if (current < search.getNumPages()) {
          current += 1;
          that.setCurrentPage(current);
          search.makeRequest(true);
        }
      });

      document.getElementById('prev').addEventListener('click', function(e) {
        var current = that.getCurrentPage();
        if (current > 1) {
          current -= 1;
          that.setCurrentPage(current);
          search.makeRequest(true);
        }
      });
    }
  }
})();

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

