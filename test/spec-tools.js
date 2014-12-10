var _ = require('underscore');

module.exports = {

  generateSampleData: function() {

    // generates sample data with three events a day (10 am, all day event and 5:15 pm): a week ago, yesterday, today and tomorrow
    var data = [];

    var times = [ '10:00', 'allday', '17:15' ]
      , dayDeltas = [ -7, -1, 0, 1 ]
      , startObjects = []
      , endObjects = [];

    _.each(
      dayDeltas,
      function(delta) {
        _.each(
          times,
          function(time) {
            var d = new Date();
            d.setDate(d.getDate() + delta);
            if (time === 'allday') {
              startObjects.push({ date: d.toISOString().slice(0, 10)});
              endObjects.push({ date: d.toISOString().slice(0, 10)});
            }
            else {
              d.setUTCHours(parseInt(time.slice(0, 2), 10));
              d.setUTCMinutes(parseInt(time.slice(-2), 10));
              startObjects.push({ dateTime: d.toISOString() });
              d.setUTCHours(23);
              d.setUTCMinutes(59);
              endObjects.push({ dateTime: d.toISOString() });
            }
          });
      });

    _.each(
      _.range(12),
      function(index) {
        var start =
        data.push({
          summary: [ 'Sample event', index + 1].join(' '),
          start: startObjects[index],
          end: endObjects[index]
        });
      });

    return data;

  }

};
