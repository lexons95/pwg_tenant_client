
export const defaultImage_system = require("../img/ImageNotFound.png");

// 0: local (国内), 1: oversea (国外)
export const stockLocation = "0";
export const configId = "klklvapor";

export const getAllProductCategory = (products = []) => {
  let result = [];
  products.forEach((aProduct)=>{
    if (aProduct.category && aProduct.category.length > 0) {
      aProduct.category.forEach((aCategory)=>{
        let foundPushedItem = result.find((anItem)=>anItem._id == aCategory._id);
        if (!foundPushedItem) {
          result.push(aCategory);
        }
      })
    }
  });
  return result;
}

export const getInventoryVariants = (productVariants, inventoryVariants) => {
  let result = {};
  let label = ""
  let variantKeys = Object.keys(productVariants);
  if (productVariants) {
    variantKeys.forEach((aKey, index)=>{
      let value = ""
      if (inventoryVariants && inventoryVariants[aKey]) {
        value = inventoryVariants[aKey];
        label += `${inventoryVariants[aKey]}${variantKeys.length - 1 != index ? " / " : ""}`
      }
      result[aKey] = {
        name: productVariants[aKey],
        value: value
      }
    })
  }
  return {
    variants: result,
    label: label
  };
}

