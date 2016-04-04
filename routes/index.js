var express = require('express');
var router = express.Router();

//routes the user to the home page.
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Donald Trump Tweet...Remix!' });
});

//routes the user to the about page.
router.get('/about', function(req, res, next){
  res.render('about', {title: "About"});
});

module.exports = router;
