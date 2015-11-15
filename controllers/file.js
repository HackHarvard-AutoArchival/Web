/**
 * GET /
 * My file page.
 */
exports.index = function(req, res) {
  res.render('myFiles', {
    title: 'My Files'
  });
};