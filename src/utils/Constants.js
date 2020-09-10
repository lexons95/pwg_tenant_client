
import { setCartCache, getConfigCache } from './customHook';

export const defaultImage_system = require("../img/ImageNotFound.png");

// 0: local (国内), 1: oversea (国外)
// export const stockLocation = "1";
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

const getTotalFromItems = (items, property, initial = 0) => {
  let total = initial;
  items.forEach((anItem)=>{
    if (property == 'weight') {
      total += (anItem[property] * anItem['qty']);
    }
    else {
      total += anItem[property];
    }
  });
  return total;
}

export const isBetween = (min = null, max = null, value = null, type = 'includeMin') => {
  // include min -> value >= min && value < max
  // include max -> value > min && value <= max

  let result = false;
  if (value && !(min == null && max == null)) {
    let passedMin = min == null ? true : false;
    let passedMax = max == null ? true : false;

    if (!passedMin) {
      if (type == 'includeMin') {
        passedMin = value >= min;
      }
      else if (type == 'includeMax') {
        passedMin = value > min;
      }
    }

    if (!passedMax) {
      if (type == 'includeMin') {
        passedMax = value < max;

      }
      else if (type == 'includeMax') {
        passedMax = value <= max;
      }
    }

    result = passedMin && passedMax;
  }
  return result;
}

export const cartCalculation = (items = [], deliveryFee = 0, extraCharges = []) => {
  let result = {
    type: stockLocation,
    items: [],
    deliveryFee: 0,
    charges: [],
    total: 0,
    subTotal: 0,
    allowOrder: false,
    totalWeight: 0
  }
  let minPurchase = 125
  let subTotal = 0;
  let total = 0;

  if (items.length > 0) {

    items.forEach((anItem)=>{
      subTotal += (anItem.price * anItem.qty)
    })
  
    let configCache = getConfigCache();
    let deliveryFee = configCache && configCache.config && configCache.config.delivery ? configCache.config.delivery : 0;
    if (subTotal >= minPurchase) {
      deliveryFee = 0
    }
    total = subTotal + deliveryFee;
    let allCharges = [
      {
        code: 'deliveryFee',
        name: '邮费',
        value: deliveryFee
      }
    ]
  
    result = {
      type: stockLocation,
      items: items,
      deliveryFee: deliveryFee,
      charges: allCharges,
      total: total,
      subTotal: subTotal,
      allowOrder: true
    }
  }

  return result;

}

export const plusItemQty = (items, inventoryId, qty) => {
  let result = {
    success: false,
    message: "not found",
    data: {}
  }
  if (items && items.length > 0) {
    let newCartItems = []
    items.forEach((anItem)=>{
      if (anItem.inventoryId == inventoryId) {
        let newQty = anItem['qty'] + qty;
        if (newQty > anItem.stock) {
          result = {
            success: false,
            message: "insufficient stock",
            data: {}
          }
        }
        else {
          anItem['qty'] = newQty;
          newCartItems.push(anItem);
          result = {
            success: true,
            message: "increased",
            data: {}
          }
        }
      }
      else {
        newCartItems.push(anItem);
      }
    });

    if (result.success) {
      setCartCache({
        items: newCartItems
      });
      result = {
        success: true,
        message: "updated",
        data: newCartItems
      }
    }
  }
  return result;
}

export const minusItemQty = (items, inventoryId, qty) => {
  let result = {
    success: false,
    message: "not found",
    data: {}
  }
  if (items && items.length > 0) {
    let newCartItems = []
    items.forEach((anItem)=>{
      if (anItem.inventoryId == inventoryId) {
        let newQty = anItem['qty'] - qty;
        if (newQty > 0) {
          anItem['qty'] = newQty;
          newCartItems.push(anItem);
          result = {
            success: true,
            message: "decreased",
            data: {}
          }
        }
        else {
          result = {
            success: true,
            message: "removed",
            data: {}
          }
        }
      }
      else {
        newCartItems.push(anItem);
      }
    });
    setCartCache({
      items: newCartItems
    })
    result = {
      success: true,
      message: "updated",
      data: newCartItems
    }
  }
  return result;
}

export const removeItemFromCart = (items, itemIds = []) => {
  let result = {
    success: false,
    message: "not found",
    data: {}
  }
  let newCartItems = [];
  items.forEach((anItem)=>{
    if (itemIds.indexOf(anItem.inventoryId) < 0) {
      newCartItems.push(anItem)
    }
  })
  setCartCache({
    items: newCartItems
  })
  result = {
    success: true,
    message: "updated",
    data: newCartItems
  }
  return result;
}



// {
//   "_id": {
//       "$oid": "5ee6c911b50d8c662e11a977"
//   },
//   "items": [{
//       "inventoryId": "5ee5b1eb4be95b458838a8bc",
//       "qty": 1,
//       "price": 65,
//       "product": {
//           "_id": "5ee5a6bf4be95b458838a8bb",
//           "name": "小骏马手卷草系列",
//           "image": "saas_3_1592111595609_colts-vanilla.jpg"
//       },
//       "variant": {
//           "v1592111401705": {
//               "name": "口味",
//               "value": "酸甜荔枝"
//           },
//           "v1592111416833": {
//               "name": "净含量",
//               "value": "40g"
//           }
//       }
//   }, {
//       "inventoryId": "5ee5b2294be95b458838a8c3",
//       "qty": 1,
//       "price": 60,
//       "product": {
//           "_id": "5ee5b2034be95b458838a8c2",
//           "name": "大马特供版琥珀",
//           "image": "saas_0_1592111657832_amberleaf30.jpg"
//       },
//       "variant": {
//           "v1592111636409": {
//               "name": "净含量",
//               "value": "30g"
//           }
//       }
//   }, {
//       "inventoryId": "5ee5d6e04be95b458838a8dd",
//       "qty": 1,
//       "price": 65,
//       "product": {
//           "_id": "5ee5d4ae4be95b458838a8d9",
//           "name": "阿姆斯特丹手卷草系列",
//           "image": "saas_0_1592121056429_amsterdamer-appleice.jpg"
//       },
//       "variant": {
//           "v1592120918064": {
//               "name": "口味",
//               "value": "阿姆斯特丹冰爽葡萄"
//           },
//           "v1592120924529": {
//               "name": "净含量",
//               "value": "40g"
//           }
//       }
//   }, {
//       "inventoryId": "5ee5e25d4be95b458838a91a",
//       "qty": 2,
//       "price": 17,
//       "product": {
//           "_id": "5ee5e1794be95b458838a918",
//           "name": "黑马原味过滤嘴系列",
//           "image": "saas_0_1592123997298_darkhorse-red-8-22.jpg"
//       },
//       "variant": {
//           "sku": {
//               "name": "尺寸",
//               "value": "6X22mm"
//           },
//           "v1592123789471": {
//               "name": "滤嘴数量",
//               "value": "100粒/袋"
//           }
//       }
//   }, {
//       "inventoryId": "5ee5a1ae4be95b458838a8a6",
//       "qty": 2,
//       "price": 3,
//       "product": {
//           "_id": "5ee5a13e4be95b458838a8a5",
//           "name": "虎牌70mm手卷纸",
//           "image": "saas_0_1592107751834_mascotte-original70.jpg"
//       }
//   }],
//   "remark": "",
//   "paid": false,
//   "trackingNum": "",
//   "sentOut": false,
//   "total": 242,
//   "deliveryFee": 12,
//   "customer": {
//       "name": "皇甫欣宇",
//       "contact": "19982055837",
//       "address": "四川省广安市岳池县财富中心c栋",
//       "postcode": "628399",
//       "province": "四川省"
//   },
//   "createdAt": {
//       "$date": "2020-06-15T01:04:17.663Z"
//   },
//   "updatedAt": {
//       "$date": "2020-06-15T01:04:17.663Z"
//   },
//   "__v": 0
// }
