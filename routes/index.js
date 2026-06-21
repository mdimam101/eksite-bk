const express = require('express')

const router = express.Router()
const userSignUpController = require('../controller/users/userSignUp')
const userSignInController = require('../controller/users/userSignIn')
const userDetailsController = require('../controller/users/userDetails')
const authToken = require('../middleware/authToken')
const userLogout = require('../controller/users/userLogout')
const allUsers = require('../controller/users/allUsers')
const uploadProductController = require('../controller/products/uploadProduct')
const getAllProduct = require('../controller/products/getAllProduct')
const updateProduct = require('../controller/products/updateProduct')
const getCategoryProductOne = require('../controller/products/getCategoryProductOne')
const getCategoryWishProduct = require('../controller/products/getCategoryWishProduct')
const getProductDetails = require('../controller/products/getProductDetails')
const addToCartController = require('../controller/users/addToCartController')
const countAddToCartProduct = require('../controller/users/countAddToCartProduct')
const increaseQuantityController = require('../controller/users/increaseQuantityController ')
const getCartProductsController = require('../controller/users/getCartProductsController ')
const decreaseQuantityController = require('../controller/users/decreaseQuantityController')
const removeFromCartController = require('../controller/users/removeFromCartController')
const searchProduct = require('../controller/products/searchController')
const searchSuggestionController = require('../controller/products/searchSuggestionController')
const banarController = require('../controller/banars/banarController')
const uploadBanner = require('../controller/banars/uploadBanner')
const deleteBanner = require('../controller/banars/deleteBanner')
const BannerModel = require('../models/bannerModel')
const placeOrderController = require('../controller/users/placeOrderController')
const getAllOrders = require('../controller/products/getAllOrders')
const getUserOrders = require('../controller/users/getUserOrders')
const OrderModel = require('../models/OrderModel')
const orderCancelController = require('../controller/users/orderCancelController')
const orderReturnController = require('../controller/users/orderReturnController')
const reduceProductStock = require('../controller/products/reduceProductStock')
const updateOrderStatus = require('../controller/products/updateOrderStatus')

// reviews
const createReview = require("../controller/reviews/createReview");
const getProductReviews = require("../controller/reviews/getProductReviews");
const updateShipping = require('../controller/users/updateShipping')

// coupon section 
const applyCoupon = require('../controller/coupons/applyCoupon');
const isAdmin = require('../middleware/isAdmin');
const { createCoupon, listCoupons, updateCoupon, softDeleteCoupon, toggleActive } =
  require('../controller/coupons/adminCoupons');

const { requestOtp, verifyOtp } = require('../controller/auth/phoneAuth');

const deleteAccount = require('../controller/account/deleteAccount')

const commitCoupon = require('../controller/coupons/commitCoupon');
const commonUploadInfoController = require('../controller/common/commonUploadInfo')
const commonGetInfoController = require('../controller/common/commonGetinfo')

const googleLoginController = require('../controller/users/googleLogin');
const updateUserMembership = require('../controller/users/updateUserMembership');
const getUserById = require('../controller/users/getUserById');

const { updateUserPoint, getUserPoint } = require('../controller/users/userPointController');

router.post('/google-login', googleLoginController);

router.post('/signup', userSignUpController)
router.post('/signin', userSignInController)
// get user info 
// router.get('/user-details',authToken, userDetailsController)

// ✅ get user + shipping
router.get('/user-details', authToken, userDetailsController)

// delete Account
router.delete("/account", authToken, deleteAccount);

// ✅ upsert shipping (user can edit anytime)
router.put('/user/shipping', authToken, updateShipping)

// Lifetime point APIs. These are called manually from order purchase/cancel/refund flow.
router.post('/user/update-point', updateUserPoint)
router.get('/user/point/:userId', getUserPoint)


router.get('/userLogout', userLogout)

// admin Panel
router.get('/all-users',authToken, allUsers)
router.get('/admin/users/:userId', authToken, getUserById)
router.patch('/admin/users/:userId/membership', authToken, updateUserMembership)


// upload Product
//router.post('/upload-product',authToken, uploadProductController)
router.post('/upload-product', uploadProductController)

// get all product
router.get('/get-product', getAllProduct) // No need auth check

// update product
router.post('/update-product', updateProduct)

// common upload info
router.post('/upload-common-info', commonUploadInfoController)

// common get info
router.get('/get-common-info', commonGetInfoController)

// get cetegory name
router.get('/get-categoryProduct', getCategoryProductOne)

router.post('/category-wish-product', getCategoryWishProduct)

// get product details
router.post('/product-details', getProductDetails)
router.get('/product-details', getProductDetails);  //optionall
router.get('/product-details/:productId', getProductDetails); // GET /:id  (optional)

// user add to cart
router.post('/addtocart',authToken, addToCartController)
router.get('/countAddToCartProduct',authToken, countAddToCartProduct)
router.get('/get-cart-products', authToken, getCartProductsController);
router.post('/increase-quantity', authToken, increaseQuantityController);
router.post('/decrease-quantity', authToken, decreaseQuantityController);
router.delete("/remove", authToken, removeFromCartController);

//search
router.get("/search", searchProduct);
router.get("/search-suggestions", searchSuggestionController);

//banar
router.get("/banner",banarController)
router.post("/upload-banner", authToken, uploadBanner);
router.delete('/delete-banner', deleteBanner)
// order
router.post("/orders", authToken, placeOrderController);
router.put("/reduce-stock", reduceProductStock);

// Sob order gula fetch korar route (admin access only)
// router.get("/all-orders",authToken,  getAllOrders)
router.get("/all-orders",  getAllOrders);

// userOrder
router.get("/user-all-ordrs",authToken, getUserOrders)

// Admin can update order or item status from frontend
router.patch('/admin/orders/:orderId/status', authToken, updateOrderStatus);

router.delete('/cancel/:orderId', authToken, orderCancelController )
// same controller handles both:
router.put('/return/:orderId',authToken, orderReturnController)// for full order
router.put("/return/:orderId/:itemId",authToken, orderReturnController); // for item return

// submit review (must be logged in)
router.post("/reviews", authToken, createReview);

// get reviews by product
router.get("/reviews/:productId", getProductReviews);


// Coupon public apply (works for guest too). If you want strict user-only, add authToken.
router.post('/coupons/apply',  authToken,  applyCoupon);

router.post('/coupons/commit', authToken, commitCoupon);

// Admin Coupon CRUD (protected)
router.post('/admin/coupons',   createCoupon);//authToken,isAdmin,
router.get('/admin/coupons',  listCoupons);//authToken, isAdmin,
router.patch('/admin/coupons/:id',  updateCoupon);//authToken, isAdmin,
router.patch('/admin/coupons/:id/toggle', toggleActive);//authToken,  isAdmin,
router.delete('/admin/coupons/:id',  softDeleteCoupon);//authToken, 

// ✅ Root path for default response
router.get("/", (req, res) => {
  res.send("✅ EkoSite API is live and running on Vercel!");
});
// ✅ Phone OTP controllers


router.post('/auth/request-otp', requestOtp);
router.post('/auth/verify-otp',  verifyOtp);




module.exports = router //by default set router