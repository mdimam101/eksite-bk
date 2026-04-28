// utils/orderStatus.js
// "সফল" অর্ডার বলতে আমরা যেগুলো বাতিল/পেমেন্ট-ফেইল হয়নি সেগুলো বুঝব
module.exports.NON_SUCCESS_EXCLUDE = ["Cancelled", "Canceled", "PaymentFailed"];
