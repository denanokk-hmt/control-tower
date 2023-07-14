var express = require('express');
var router = express.Router();

const conf = require(`../config/configure`)

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', 
    { 
      title: `Control Tower on stage`,
      body: `Bwing project`  
    }
  );
});

module.exports = router;
