### Convenience functions for simple Google Calendar usage for NodeJS

Based on [google-calendar](https://raw.githubusercontent.com/wanasit/google-calendar)

To install:

```
npm install google-calendar-helpers
```

### Usage

Initialize API:

```
var accessToken = '--- your access token ---'
  , clientId = '--- client ID ---'
  , clientSecret = '--- client secret ---'
  , calendarId = '--- Google Calendar Id ---'
  , CalendarClient = require('google-calendar-helpers');
  , calendarClient = new CalendarClient(accessToken, clientId, clientSecret, calendarId);
```

Access tokens and stuff explained [here](https://developers.google.com/accounts/docs/OAuth2) and
a node module for obtaining access token and refresh token [here](https://github.com/jaredhanson/passport-google-oauth).

#### Methods

__calendarClient.getEvents(timeMin, timeMax, callback)__

Returns a list of events from `timeMin` to `timeMax` (RFC 3339 formatted strings)

NB: Makes multiple requests when necessary (if there are more than one page of events)

__calendarClient.getPastEvents(options, callback)__
__calendarClient.getFutureEvents(options, callback)__

Returns a list of past or future events, respectively.

By default, ```getPastEvents``` returns events whose start time is past even if their end time is still in the future.
You can override by setting ```endTimePast``` to ```true``` in ```options```. Then, only events which have ended, will
be returned.

All day events which have started today or earlier, will always be returned.

Options object (optional) can have property 'dayRange' specifying how many days into
the past or future to extend the query. Defaults to 30.

__calendarClient.submitNewEvent(event, callback)__

Adds new event to calendar. `event` must be a Google
[event resource object](https://developers.google.com/google-apps/calendar/v3/reference/events#resource)

Callback is called with `error` and `event` which is the newly created event.

__calendarClient.submitModifiedEvent(event, callback)__

Updates an event. `event` must be an event resource object with property `id` of an existing event.

Callback is called with `error` and `event` which is the modified event as returned by Google.

__calendarClient.deleteEvent(eventId, callback)__

Deletes an event. Argument `eventId` (string) is the id of an existing event.

Callback is called with `error` as only argument.

### Testing

Run `grunt jasmine_node` to test. Add your access tokens etc. in `test/config.json` for the tests to work.
_NB! Tests erase existing event in the calendar, so create a specific test calendar for testing!_


