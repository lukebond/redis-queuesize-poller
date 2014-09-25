# redis-queuesize-poller
Polls redis at specified interval to fetch the size of a list of queues and exposes results via a getter.

Useful for a monitoring endpoint, to report how much stuff you have in your Redis queue.

Basic usage:
```
var RedisQueueSizePoller = require('../index');
var Redis = require('redis');
var redis = Redis.createClient();
var poller = new RedisQueueSizePoller({}, ['wow1', 'wow2', 'wow3']);

redis.multi()
  .rpush('wow1', '1')
  .rpush('wow1', '2')
  .rpush('wow1', '3')
  .rpush('wow1', '4')
  .rpush('wow2', '1')
  .rpush('wow2', '2')
  .rpush('wow3', '1')
  .rpush('wow3', '2')
  .rpush('wow3', '3')
  .exec(function (err, result) {
    setTimeout(function () {
      var sizes = poller.getQueueSizes();
      console.log(sizes);
      poller.close();
      redis.close();
    }, 5000);
```

...produces:
```
{ one: 4, two: 2, three: 3 }
```

See tests for more examples.

## Licence
ISC
