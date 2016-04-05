var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});



var Twitter = require('twitter');

//This is where everything that is used by the twitter account is based.
var client = new Twitter({
  "consumer_key": process.env.CONSUMER_KEY,
  "consumer_secret": process.env.CONSUMER_SECRET,
  "access_token_key": process.env.ACCESS_TOKEN_KEY,
  "access_token_secret": process.env.ACCESS_TOKEN_SECRET
});


/**
 * Stream statuses filtered by keyword
 * number of tweets per second depends on topic popularity
 **/

function twitter_stream(client_stream) {

//Used this website to get the Twitter ID: http://gettwitterid.com/
  client_stream.stream('statuses/filter', {follow: 25073877}, function (stream) {

    stream.on('data', function (tweet) {
      if(tweet.user["id"] == 25073877) {
        create_trump_remix_tweet(client);
      }
    });

    stream.on('error', function (error) {
      console.log(error);
    });
  });
}

//this removes links and co\ information that messes up the tweets.
function clean_tweets(tweet_array){
  //from http://stackoverflow.com/questions/5767325/remove-a-particular-element-from-an-array-in-javascript.
  for(var i = tweet_array.length - 1; i >= 0; i--) {
    if(tweet_array[i].match(/http/)) {
      tweet_array.splice(i, 1);
    }
    else if(tweet_array[i].match(/co\//)) {
      tweet_array.splice(i, 1);
    }
  }
  return tweet_array
}

//This gets the specified section of the tweets, breaking them apart into individual sentences that can later be used to create a new tweet.
function get_part_of_tweet(tweets, section, end_of_phrase) {

  //This is in a try-catch block because it will occasionally produce a TypeError for an unknown reason. This is to guard against that crashing the entire program.
  try{
    var tweet_parts_array = [];

    for (var i = 0; i < tweets.length; i++) {
      var tweet_text = tweets[i]['text'];
      var split_text_array = tweet_text.split(/[\.\?\!]/);
      split_text_array = clean_tweets(split_text_array);
      if (split_text_array.length > section) {
        var tweet_section = split_text_array.slice(section);
        tweet_section = tweet_section.slice(-2, -1);
        tweet_section = tweet_section + end_of_phrase;
        if (tweet_section.length > 1) {
          tweet_parts_array.push(tweet_section);
        }
      }
    }

    return tweet_parts_array;
  }
  catch (err){
    return tweet_parts_array;
  }


}

//This takes the lists of possible tweet sections and randomly chooses one from each of them.
function create_tweet(part_one, part_two, part_three){
  var choice_one = random_number_generator(part_one.length-1, 0);
  var choice_two = random_number_generator(part_two.length-1, 0);
  var choice_three = random_number_generator(part_three.length-1, 0);
  var tweet = part_one[choice_one] + part_two[choice_two] + part_three[choice_three];
  return tweet;
}

//This fetches Trump tweets from a random batch of 200 since he announced he was running for President.
function create_trump_remix_tweet(client_rest_search) {

    //This gets the Donald Trump's last 200 tweets.
  client_rest_search.get('statuses/user_timeline', {user_id: "25073877", count : 200}, function (error, tweets, response) {

    //This breaks Trump's tweets into indiviual sections.
    var tweet_part_one_array = get_part_of_tweet(tweets, 0, ".");
    var tweet_part_two_array = get_part_of_tweet(tweets, 1, ".");
    var tweet_part_three_array = get_part_of_tweet(tweets, 2, "!");

    //This is where the tweet is created. The initial tweet size is to make sure that goes through the loop.
    var tweet = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    //This loop makes sure that the newly created tweet is small enough to function as a tweet.
    while (tweet.length > 140){
      tweet = create_tweet(tweet_part_one_array, tweet_part_two_array, tweet_part_three_array);
    }
    post_tweet(tweet);
  });
}

//This puts a new tweet from the Trumpbot onto twitter.
function post_tweet(new_tweet) {
  client.post('statuses/update', {status: new_tweet}, function (error, tweet, response) {
    if (!error) {
      console.log(new_tweet);
    }
  });
}

//This randomly gets a number to find Donald Trump tweets.
function random_number_generator(max_value, min_value){
  return Math.floor((Math.random() * max_value) + 1);
}

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//This starts the app on port 3010 (or whatever is assigned by the host. This is used to display the webpage for the Twitterbot.
app.listen(process.env.PORT || 3010, function(){
  console.log('Donald Trump Tweet Remix app listening on port 3010 (or port assigned by host).');
});

twitter_stream(client);
module.exports = app;