function getPositivePriority(product) {
  const priority = Number(product?.priorityProduct);

  return Number.isInteger(priority) && priority > 0 ? priority : null;
}

function sortProductsByPriority(products) {
  return products.sort((left, right) => {
    const leftPriority = getPositivePriority(left);
    const rightPriority = getPositivePriority(right);

    if (leftPriority === null && rightPriority === null) return 0;
    if (leftPriority === null) return 1;
    if (rightPriority === null) return -1;

    return leftPriority - rightPriority;
  });
}

module.exports = { getPositivePriority, sortProductsByPriority };
