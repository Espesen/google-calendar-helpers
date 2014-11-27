var _ = require('underscore');

function generatePastEventsReport(events) {
  // list format: <date YYYY-MM-DD> <start time hh:mm> <event title>

  var line, result = '';
  _.each(events, function(event) {
    var dateString;
    if (event.status !== 'cancelled') {
      dateString = event.start && event.start.date ? event.start.date : undefined;
      dateString = dateString || (event.start ? event.start.dateTime : undefined);
      line = dateString.slice(0, 10) + ' ';
      line += dateString.length > 10 ? dateString.slice(11, 16) : '00:00';
      line += ' ' + event.summary;
      result += line + '\n';
    }
  });

  return result;

}

module.exports = {
  generatePastEventsReport: generatePastEventsReport
};