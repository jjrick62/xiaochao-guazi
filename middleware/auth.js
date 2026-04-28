module.exports = {
  // Require admin login for admin routes
  requireAdmin(req, res, next) {
    if (req.session && req.session.adminId) {
      return next();
    }
    // AJAX request
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(401).json({ error: '未登录' });
    }
    // Page request
    res.redirect('/admin/login');
  },

  // Redirect to dashboard if already logged in
  redirectIfLoggedIn(req, res, next) {
    if (req.session && req.session.adminId) {
      return res.redirect('/admin');
    }
    next();
  },
};
