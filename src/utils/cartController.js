import { format, isAfter } from 'date-fns';
import { setCartCache, getConfigCache } from './customHook';
import { stockLocation } from './Constants';

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

const conditionRangeChecker = (items = [], condition = null, initial = 0) => {
  let checkedConditionResult = null;

  if (condition != null) {
    if (condition.type == 'range') {
      let minValue = condition.min ? condition.min : null;
      let maxValue = condition.max ? condition.max : null;
  
      let total = getTotalFromItems(items, condition.property, initial);
  
      let passedMin = minValue == null ? true : false;
      let passedMax = maxValue == null ? true : false;
  
      if (minValue > maxValue && (minValue != null && maxValue != null)) {
        passedMin = false;
        passedMax = false;
      }
      else {
        if (minValue != null && total > minValue) {
          passedMin = true;
        }
        if (maxValue != null && total <= maxValue) {
          passedMax = true;
        }
      }
  
      let success = passedMin && passedMax;
      checkedConditionResult = {
        ...condition,
        success: success,
        message: !success ? condition.property + " not within range" : ""
      };
    }

  }

  return checkedConditionResult;
}

/*
Editor UI
PS: calculate charges first then promotion
PS: all weight in g
*/

// condition to allow placing order
const placeOrderConditions = [
  {
    type: 'range',
    property: 'weight',
    min: 0,
    max: 3000
  }
]

const deliveryFeeMethods = [
  {
    code: 'deliveryFee',
    type: 'static',
    defaultValue: 123
  },
  {
    code: 'deliveryFee',
    type: 'dynamic',
    defaultValue: 80,
    conditions: [
      {
        type: 'range',
        property: 'weight',
        min: 0,
        max: 1000,
        value: 80
      }, 
      {
        type: 'range',
        property: 'weight',
        min: 1000,
        max: 2000,
        value: 96
      },
      {
        type: 'range',
        property: 'weight',
        min: 2000,
        max: 3000,
        value: 116
      }
    ]
  }
]

export const cartCalculation_1 = (items = [], deliveryFee = 0, extraCharges = []) => {
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
  let subTotal = 0;
  let total = 0;

  if (items.length > 0) {

    items.forEach((anItem)=>{
      if (anItem.onSale) {
        subTotal += (anItem.salePrice * anItem.qty)
      }
      else {
        subTotal += (anItem.price * anItem.qty)
      }
    })
  
    if (stockLocation == '0') {
      /*
      max weight: 2kg
  
      delivery fee range: 
      0 ~ 1 kg (80)
      1 ~ 2 kg (96)
  
      custom conditions:
      A 5 草 free 1 皇室 SXB 15
      B 10 草 free 2 皇室 SXB 30
      C 15 草 free 3 皇室 SXB 55
      D 20 草 free 4 皇室 SXB 70
      E 25 草 free 5 皇室 SXB 90
      */
  
      // console.log('itemsitems',items)
  
      
  
      // const customChargesFields = [
      //   {
      //     type: 'boolean',
      //     property: 'qty',
      //     formula: (items)
      //   }
      // ]
      // A 5 草 free 1 皇室 SXB 15
      // B 10 草 free 2 皇室 SXB 30
      // C 15 草 free 3 皇室 SXB 55
      // D 20 草 free 4 皇室 SXB 70
      // E 25 草 free 5 皇室 SXB 90
      
      let initialWeight = 300;
      let allowPlacingOrder = true;
      let message = "";
      let deliveryFeeResult = null;
  
      if (placeOrderConditions.length == 0) {
        allowPlacingOrder = true;
      }
      else {
        let checkedOrderResult = conditionRangeChecker(items, placeOrderConditions[0], initialWeight);
        if (checkedOrderResult != null && !checkedOrderResult.success) {
          allowPlacingOrder = false;
          message += '\n' + checkedOrderResult.message;
        }
      }
  
      // custom charges
      // check delivery fee
      let deliveryFeeType = 'dynamic';
      let foundMethod = deliveryFeeMethods.find((aMethod)=>{return aMethod.type == deliveryFeeType})
      if (foundMethod) {
        // conditions's order affect the result, should arrange from lower range to higher range (deliveryFeeMethods[1].conditions)
        foundMethod.conditions && foundMethod.conditions.forEach((aCondition)=>{
          let checkResult = conditionRangeChecker(items, aCondition, initialWeight);
          if (checkResult != null && checkResult.success) {
            deliveryFeeResult = checkResult;
          }
        })
      }
      
  
      let totalWeight = getTotalFromItems(items, 'weight', 300);
      // console.log('totalWeight',totalWeight)
  
      let allCharges = [
        {
          code: 'deliveryFee',
          name: '邮费',
          value: deliveryFeeResult != null ? deliveryFeeResult.value : null
        },
        ...extraCharges
      ]
  
      total = subTotal;
      allCharges.forEach((aCharge)=>{
        if (aCharge.value != null) {
          total += aCharge.value;
        }
      });
  
      result = {
        type: stockLocation,
        items: items,
        deliveryFee: deliveryFeeResult != null ? deliveryFeeResult.value : null,
        charges: allCharges,
        total: total,
        subTotal: subTotal,
        allowOrder: allowPlacingOrder,
        totalWeight: totalWeight
      }
    }
    else {
      let initialWeight = 300;
      let allowPlacingOrder = true;
      let message = "";
  
      if (placeOrderConditions.length == 0) {
        allowPlacingOrder = true;
      }
      else {
        let checkedOrderResult = conditionRangeChecker(items, placeOrderConditions[0], initialWeight);
        if (checkedOrderResult != null && !checkedOrderResult.success) {
          allowPlacingOrder = false;
          message += '\n' + checkedOrderResult.message;
        }
      }

      let totalWeight = getTotalFromItems(items, 'weight', 300);
      let allCharges = [
        {
          code: 'deliveryFee',
          name: '邮费',
          value: deliveryFee != null ? deliveryFee : null
        }
      ]
      total = subTotal;
      allCharges.forEach((aCharge)=>{
        if (aCharge.value != null) {
          total += aCharge.value;
        }
      });

      result = {
        type: stockLocation,
        items: items,
        deliveryFee: deliveryFee,
        charges: allCharges,
        total: total,
        subTotal: subTotal,
        allowOrder: allowPlacingOrder,
        totalWeight: totalWeight
      }
    }
  }

  return result;

}

const maxOrderWeight = 99999;
const baseOrderWeight = 0;
export const cartCalculation = (items = [], promotions = []) => {
  let configCache = getConfigCache();
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

  if (configCache && configCache.config && items.length > 0) {
    let minPurchases = 0;
    let minWeight = 0;
    let maxWeight = maxOrderWeight;
    let initialWeight = baseOrderWeight;

    let totalWeight = initialWeight;
    let subTotal = 0;
    let deliveryFee = configCache.config.delivery ? configCache.config.delivery : 0
  
    if (items.length > 0) {
  
      items.forEach((anItem)=>{
        if (anItem.onSale) {
          let checkedSalePrice = anItem.salePrice ? anItem.salePrice : anItem.price;
          subTotal += (checkedSalePrice * anItem.qty)
        }
        else {
          subTotal += (anItem.price * anItem.qty)
        }
        totalWeight += (anItem.weight * anItem.qty)
      });
      
      let allExtras = [];
      let finalSubtotal = subTotal;
      let finalDeliveryFee = deliveryFee;
      promotions.forEach((aPromotion)=>{
        let discountValue = aPromotion.discountValue ? parseFloat(aPromotion.discountValue) : 0
        let value = discountValue;
        if (aPromotion.rewardType == 'percentage') {
          value = finalSubtotal * discountValue / 100;
          finalSubtotal = finalSubtotal - (finalSubtotal * discountValue / 100)
          if (finalSubtotal < 0) {
            finalSubtotal = 0;
          }
        }
        else if (aPromotion.rewardType == 'fixedAmount') {
          finalSubtotal = finalSubtotal - discountValue;
          if (finalSubtotal < 0) {
            finalSubtotal = 0;
          }
        }
        else if (aPromotion.rewardType == 'freeShipping') {
          value = deliveryFee;
          finalDeliveryFee = 0;
        }
        else if (aPromotion.rewardType == 'charges') {
          finalSubtotal += discountValue;
          if (finalSubtotal < 0) {
            finalSubtotal = 0;
          }
        }

        allExtras.push({
          promotionId: aPromotion._id,
          name: aPromotion.name,
          description: aPromotion.description,
          type: aPromotion.type,
          rewardType: aPromotion.rewardType,
          discountValue: aPromotion.discountValue,
          value: value
        })
      })

      let total = 0;
      total = finalSubtotal + finalDeliveryFee;

      result = {
        type: stockLocation,
        items: items,
        deliveryFee: deliveryFee,
        charges: allExtras,
        total: total,
        subTotal: subTotal,
        allowOrder: totalWeight >= minWeight && totalWeight <= maxWeight && subTotal >= minPurchases,
        totalWeight: totalWeight
      }
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

/*
  check:
  published
  date (expired/onGoing)
  conditions (all minimums)

  */

 const groupPromotions = (promotions=[]) => {
  let allPromotions = promotions
  let activePromotions = []
  let passivePromotions = []
  allPromotions.forEach((aPromotion)=>{
    let validPromotion = checkPromotionStatus(aPromotion.startDate, aPromotion.endDate) && aPromotion.published;
    if (validPromotion) {
      if (aPromotion.type == 'active') {
        activePromotions.push(aPromotion)
      }
      else if (aPromotion.type == 'passive') {
        passivePromotions.push(aPromotion)
      }
    }
  })

  return {
    activePromotions,
    passivePromotions
  }
}

const checkPromotionStatus = (start, end) => {
  let started = isAfter(new Date(), new Date(start));
  let expired = isAfter(new Date(), new Date(end));

  return expired ? false : (started ? true : false) 
}

const checkPromotionConditions = (cartItems, promotion) => {
  let totalPurchases = 0;
  let totalQuantity = 0;
  let totalWeight = 0;

  let selectedPromotionProducts = promotion.products;
  let selectedPromotionCategories = promotion.categories;

  cartItems.forEach((aCartItem)=>{
    let passedProducts = false;
    if (aCartItem.product && aCartItem.product._id) {
      passedProducts = selectedPromotionProducts.length > 0 ? selectedPromotionProducts.indexOf(aCartItem.product._id) >= 0 : true;
    }
    let passedCategories = false;
    if (aCartItem.product && aCartItem.product.categoryId) {
      passedCategories = selectedPromotionCategories.length > 0 ? selectedPromotionCategories.indexOf(aCartItem.product.categoryId) >= 0 : true;
    }
    if (passedProducts && passedCategories) {
      let price = aCartItem.onSale && aCartItem.salePrice ? aCartItem.salePrice : aCartItem.price;
      totalPurchases += (price * aCartItem.qty);
      totalQuantity += aCartItem.qty;
      if (aCartItem.weight) {
        totalWeight += (aCartItem.weight * aCartItem.qty);
      }
    }
  });

  let minPurchases = promotion.minPurchases;
  let minQuantity = promotion.minQuantity;
  let minWeight = promotion.minWeight;

  let passedPurchases = true;
  if (minPurchases) {
    passedPurchases = totalPurchases >= minPurchases
  }
  let passedQuantity = true;
  if (minQuantity) {
    passedQuantity = totalQuantity >= minQuantity 
  }
  let passedWeight = true;
  if (minWeight) {
    passedWeight = totalWeight >= minWeight
  }

  let result = null;

  if (passedPurchases && passedQuantity && passedWeight) {
    result = promotion
  }
  
  return result;
}

const checkPassivePromotions = (cartItems=[], promotions=[]) => {
  let availablePromotions = [];
  promotions.forEach(aPromotion=>{
    let passed = checkPromotionConditions(cartItems, aPromotion)
    if (passed) {
      availablePromotions.push(passed);
    }
  });
  return availablePromotions;
}

export const checkActivePromotions = (cartItems=[], promotions=[], promoCode=null) => {
  let result = [];
  if (promoCode) {
    let foundPromotion = promotions.find((aPromotion)=>{
      if (aPromotion.code) {
        return aPromotion.code == promoCode
      }
      return false;
    });

    if (foundPromotion) {
      let passed = checkPromotionConditions(cartItems, foundPromotion);
      if (passed) {
        result.push(passed);
      }
    }
  }

  return result;
}

export const handlePromotionsChecking = (cartItems, promotionsData=[], promoCode=null) => {
  let { activePromotions, passivePromotions } = groupPromotions(promotionsData);
  let passedPassive = checkPassivePromotions(cartItems, passivePromotions);
  let passedActive = checkActivePromotions(cartItems, activePromotions, promoCode);

  let allPassed = [...passedPassive, ...passedActive]
  // console.log('allPassed',allPassed)
  // console.log('activePromotions',activePromotions)
  // console.log('passivePromotions',passivePromotions)
  return allPassed;
}