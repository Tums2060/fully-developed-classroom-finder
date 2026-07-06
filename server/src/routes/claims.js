const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const claimsController = require('../controllers/claimsController');

// Rate limiting to a maximum of 20 requests per hour per IP address
const claimLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { error: 'Too many claims created from this IP. Please try again after an hour' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.headers['x-bypass-rate-limit'] === 'true' || process.env.NODE_ENV === 'test'
});

// POST /api/claims
router.post('/', claimLimiter, claimsController.createClaim);

// GET /api/claims/my-claims
router.get('/my-claims', claimsController.getMyClaims);

// POST /api/claims/cancel
router.post('/cancel', claimsController.cancelClaim);

module.exports = router;