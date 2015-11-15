/**
 * GET /
 * File page.
 */

exports.index = function(req, res) {
  res.render('autoTool', {
    title: 'Archival Tool'
  });
};

exports.myFiles = function(req, res) {
  res.render('myFiles', {
    title: 'User Files'
  });
};
