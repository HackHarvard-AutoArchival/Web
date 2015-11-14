/**
 * GET /
 * File page.
 */

exports.file = function(req, res) {
  res.render('file', {
    title: 'Submit Files'
  });
};
