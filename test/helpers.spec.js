
var helpers = require('../helpers')
  , tools = require('./spec-tools')
  , _ = require('underscore');

describe('helpers.js', function() {

  describe('method generatePastEventsList', function() {

    it('should generate a report of events', function (done) {

      var sampleData = tools.generateSampleData()
        , report = helpers.generatePastEventsReport(sampleData.slice(0, 6))
        , reportLines = report.split('\n')
        , expectedTimes = [ '10:00', '00:00', '17:15' ];

      if (!_.last(reportLines)) { reportLines = reportLines.slice(0, reportLines.length - 1); }

      expect(reportLines.length).toBe(6);
      _.each(reportLines, function(line, index) {
          expect(line.slice(0, 10)).toMatch(/\d{4}-\d{2}-\d{2}/);
          expect(line.slice(11, 16)).toMatch(expectedTimes[index % 3]);
          expect(line.slice(-14)).toMatch(/Sample\sevent\s\d/);
        }
      );
      done();
    });

  });

});