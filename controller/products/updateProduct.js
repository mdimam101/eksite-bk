const uploadProductPermission = require("../../helper/permission");
const productModel = require("../../models/productModel");

async function updateProduct (req, res) {
    try {
        if(!uploadProductPermission(req.userId)){
            throw new Error('permission denied')
        }
        const {_id, ...resBody} = req.body

        const updateProduct = await productModel.findByIdAndUpdate(_id,resBody)

        res.json({
            message: 'product Update Successfull',
            data: updateProduct,
            error: false,
            success: true
        })

    }catch (err) {
  // send data in frontend when error
  res.status(400).json({
    message: err.message || err,
    error: true,
    success: false,
  });
    }

}

module.exports = updateProduct