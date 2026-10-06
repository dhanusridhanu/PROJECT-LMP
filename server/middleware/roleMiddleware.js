/**
 * Role Authorization Middleware
 * Restricts route access to specific roles (e.g. 'admin', 'seller', 'buyer').
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] role(s).`,
      });
    }

    next();
  };
};

/**
 * Approved Seller Check Middleware
 * Ensures the artisan account is verified and has 'approved' status from an Admin.
 */
const requireApprovedSeller = (req, res, next) => {
  if (!req.user || req.user.role !== 'seller') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Seller account required.',
    });
  }

  if (!req.seller) {
    return res.status(403).json({
      success: false,
      message: 'Seller profile not found. Please complete your artisan registration.',
    });
  }

  if (req.seller.approval_status === 'pending') {
    return res.status(403).json({
      success: false,
      message: 'Your artisan account is pending Admin approval. You will be able to manage products and orders once approved.',
    });
  }

  if (req.seller.approval_status === 'rejected') {
    return res.status(403).json({
      success: false,
      message: 'Your artisan account application was not approved by the marketplace administrator.',
    });
  }

  next();
};

module.exports = {
  authorize,
  requireApprovedSeller,
};
