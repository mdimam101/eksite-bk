const uploadProductPermission = require("../../helper/permission");
const productModel = require("../../models/productModel");

async function updateProduct (req, res) {
    try {
        if(!await uploadProductPermission(req.userId)){
            throw new Error('permission denied')
        }
        const {_id, ...resBody} = req.body

        if (!_id) {
          return res.status(400).json({ message: "_id is required", error: true, success: false });
        }

        const currentProduct = await productModel.findById(_id).select("category priorityProduct").lean();
        if (!currentProduct) {
          return res.status(404).json({ message: "Product not found", error: true, success: false });
        }

        const nextCategory = resBody.category ?? currentProduct.category;
        const rawPriority = resBody.priorityProduct ?? currentProduct.priorityProduct ?? 0;
        const nextPriority = Number(rawPriority);

        if (!Number.isInteger(nextPriority) || nextPriority < 0 || nextPriority > 12 || (nextPriority > 0 && !nextCategory?.trim())) {
          return res.status(400).json({
            message: "priorityProduct must be an integer between 0 and 12 and requires a category",
            error: true,
            success: false,
          });
        }

        if (resBody.priorityProduct !== undefined) {
          resBody.priorityProduct = nextPriority;
        }

        if (nextPriority > 0) {
          const priorityExists = await productModel.exists({
            _id: { $ne: _id },
            category: nextCategory,
            priorityProduct: nextPriority,
          });
          if (priorityExists) {
            return res.status(409).json({
              message: `Priority ${nextPriority} is already used in category ${nextCategory}`,
              error: true,
              success: false,
            });
          }
        }

        const updateProduct = await productModel.findById(_id)
        if (!updateProduct) {
          return res.status(404).json({
            message: 'product not found',
            error: true,
            success: false,
          })
        }

        // Saving the document (instead of a query update) ensures conditional
        // validation such as trandingProduct/trandingPriority runs correctly.
        Object.assign(updateProduct, resBody)
        await updateProduct.save()

        res.json({
            message: 'product Update Successfull',
            data: updateProduct,
            error: false,
            success: true
        })

    }catch (err) {
  // send data in frontend when error
  const duplicatePriority = err?.code === 11000 && err?.keyPattern?.priorityProduct;
  res.status(duplicatePriority ? 409 : 400).json({
    message: duplicatePriority ? "This priority is already used in the category" : (err.message || err),
    error: true,
    success: false,
  });
    }

}

module.exports = updateProduct