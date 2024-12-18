const express = require('express');
const router = express.Router();

const rateLimiter = require('../MiddleWares/rateLimiter');
const authMiddleware = require('../MiddleWares/authMiddleware');
const CouponController = require('../Controllers/CouponsController')

router.post('/addCoupon', rateLimiter, CouponController.addCoupon);



router.get('/getCoupons', rateLimiter, CouponController.getCoupon);


router.get('/getCouponByCode/:coupon_code', rateLimiter, CouponController.getCouponByCode);



router.put('/updateCoupon/:id', rateLimiter, authMiddleware, CouponController.updateCoupon);



router.delete('/deleteCoupon/:id', rateLimiter, authMiddleware, CouponController.deleteCoupon);



router.delete('/deleteAllCoupons', rateLimiter, authMiddleware, CouponController.deleteAllCoupons);

module.exports = router;
