/**
 * GET /
 * File page.
 */

exports.index = function(req, res) {
  res.render('autoTool', {
    title: 'Archival Tool'
  });
};
