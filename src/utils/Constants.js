
import React from 'react';
import { useState, useEffect } from 'react';
import gql from "graphql-tag";
import { useQuery, useMutation, useApolloClient } from "@apollo/react-hooks";

import DefaultClientAPI from '../index';
import Loading from './component/Loading';

export const configId = "mananml";
export const defaultImage_system = require("./noImageFound.png");

// 0: local (国内), 1: oversea (国外)
export const stockLocation = "1";
// export const MIDDLETIER_URL = "http://localhost:3000/graphql";

// this is for lightsail Server
export const MIDDLETIER_URL = "http://15.165.150.23/graphql";

export const getAllProductCategory = (products) => {
  let result = [];
  products.map((aProduct)=>{
    if (aProduct.category && aProduct.category.length > 0) {
      aProduct.category.map((aCategory)=>{
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
    variantKeys.map((aKey, index)=>{
      let value = ""
      if (inventoryVariants[aKey]) {
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
  items.map((anItem)=>{
    if (property == 'weight') {
      total += (anItem[property] * anItem['qty']);
    }
    else {
      total += anItem[property];
    }
  });
  return total;
}

const conditionChecker = (items = [], condition = null, initial = 0) => {
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
  
      if (passedMin && passedMax) {
        checkedConditionResult = {
          ...condition,
          success: true
        };
      }
      else {
        checkedConditionResult = {
          ...condition,
          success: false,
          message: condition.property + " not within range"
        };
      }
    }

  }

  return checkedConditionResult;
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
  let subTotal = 0;
  let total = 0;

  if (items.length > 0) {

    items.map((anItem)=>{
      subTotal += (anItem.price * anItem.qty)
    })
  
    if (stockLocation == '1') {
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
  
      // condition to allow placing order
      const placeOrderConditions = [
        {
          type: 'range',
          property: 'weight',
          min: 0,
          max: 2000
        }
      ]
  
      const deliveryFeeMethods = [
        {
          code: 'deliveryFee',
          type: 'static',
          value: 123
        },
        {
          code: 'deliveryFee',
          type: 'dynamic',
          value: 80,
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
            }
          ]
        }
      ]
  
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
        let checkedOrderResult = conditionChecker(items, placeOrderConditions[0], initialWeight);
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
        foundMethod.conditions && foundMethod.conditions.map((aCondition)=>{
          let checkResult = conditionChecker(items, aCondition, initialWeight);
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
      allCharges.map((aCharge)=>{
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
  }

  return result;

}
const GET_USER_CONFIG_QUERY = gql`
  query userConfig($configId: String!) {
    userConfig(configId: $configId) {
        success
        message
        data
    }
  }
`

const GET_CONFIG_CACHE_QUERY = gql`
  query config {
    config @client {
      _id
      configId
      defaultImage_system
      defaultImage
      imageSrc
      paymentQRImage
      server
      profile
      currencyUnit
      delivery
    }
  }
`

const SET_CONFIG_CACHE_QUERY = gql`
  query config {
    config {
      _id
      configId
      defaultImage_system
      defaultImage
      imageSrc
      paymentQRImage
      server
      profile
      currencyUnit
      delivery
    }
  }
`

const handleConfigOuput = (config = null) => {
  let result = null;
  if (config) {
    result = {...config}
    let newDefaultImage = defaultImage_system;
    if (result.defaultImage && result.defaultImage != "") {
      newDefaultImage = result.imageSrc + result.defaultImage;
    }
    result['defaultImage'] = newDefaultImage;
  }
  return result;
}

export const setConfigCache = (data) => {
  DefaultClientAPI.client.writeQuery({
    query: SET_CONFIG_CACHE_QUERY,
    data: {
      config: handleConfigOuput(data)
    }
  });
}

export const useConfigCache = () => {
  const { data, error, loading } = useQuery(GET_CONFIG_CACHE_QUERY,{
    fetchPolicy: 'cache-only'
  });

  let result = null;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('error useConfigCache',error);
  }
  if (data && data.config) {
    result = data.config;
  }
  return result;
}

export const useConfigQuery = (input) => {
  const { data, error, loading } = useQuery(GET_USER_CONFIG_QUERY,{
    fetchPolicy: 'cache-and-network',
    variables: {
      configId: input ? input : configId
    },
    onCompleted: (result) => {
      if (result && result.userConfig && result.userConfig.success) {
        let configResult = result.userConfig.data;
        setConfigCache(configResult);
        initialCache();
      }
    }
  });
  let result = null;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('useConfigQuery',error);
  }
  if (data && data.userConfig) {
    result = handleConfigOuput(data.userConfig.data);
  }
  return result;
}

export const useCustomQuery = (query, options={}) => {
  const { data, error, loading } = useQuery(query,options);
  if (loading) return <Loading/>;
  if (error) return "error"
  return data;
}

export const useProductsState = (query, options={}) => {
  const queryResult = useQuery(query,options);
  return queryResult;
}

// custom hook starts with 'use'
// const useCustomHook = () => {
//   const [state, setState] = useState(null);
//   useEffect(() => {
//     const handleScroll = () => setScrollPosition(window.scrollY);
//     document.addEventListener('scroll', handleScroll);
//     return () =>
//       document.removeEventListener('scroll', handleScroll);
//   }, []);
// }

// export const setApolloCache = (key, query, data) => {
//   DefaultClientAPI.client.writeQuery({
//     query: query,
//     data: {
//       [key]: data
//     }
//   });
// }

const initialCache = () => {
  let sessionCart = sessionStorage.getItem(configId+"-cart");
  if (sessionCart != null) {
    setCartCache(Object.assign({},JSON.parse(sessionCart)))
  }
  else {
    setCartCache(defaultCartObj)
  }

  let sessionCustomer = sessionStorage.getItem(configId+"-customer");
  if (sessionCustomer != null) {
    setCustomerCache(Object.assign({},JSON.parse(sessionCustomer)))
  }
  else {
    setCustomerCache(defaultCustomerObj)
  }
}

const GET_CART_CACHE = gql`
  query cart {
    cart @client {
      items
    }
  }
`;

const SET_CART_CACHE = gql`
  query cart {
    cart {
      items
    }
  }
`;

const defaultCartObj = {
  items: []
}
export const setCartCache = (data) => {
  DefaultClientAPI.client.writeQuery({
    query: SET_CART_CACHE,
    data: {
      cart: data
    }
  });

  sessionStorage.setItem(configId+"-cart", JSON.stringify(data));
}

export const useCartCache = () => {
  const { data, error, loading } = useQuery(GET_CART_CACHE,{
    fetchPolicy: 'cache-only'
  });

  let result = null;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('error useCartCache',error);
  }
  if (data && data.cart) {
    result = data.cart;
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
    items.map((anItem)=>{
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
    items.map((anItem)=>{
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
  items.map((anItem)=>{
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





const GET_CUSTOMER_CACHE = gql`
  query customer {
    customer @client {
      name
      contact
      address
      postcode
      province
    }
  }
`;

const SET_CUSTOMER_CACHE = gql`
  query customer {
    customer {
      name
      contact
      address
      postcode
      province
    }
  }
`;

const defaultCustomerObj = {
  name: "",
  contact: "",
  address: "",
  postcode: "",
  province: ""
}

export const setCustomerCache = (data) => {
  DefaultClientAPI.client.writeQuery({
    query: SET_CUSTOMER_CACHE,
    data: {
      customer: data
    }
  });

  sessionStorage.setItem(configId+"-customer", JSON.stringify(data));
}

export const useCustomerCache = () => {
  const { data, error, loading } = useQuery(GET_CUSTOMER_CACHE,{
    fetchPolicy: 'cache-only'
  });

  let result = null;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('error useCartCache',error);
  }
  if (data && data.customer) {
    result = data.customer;
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
