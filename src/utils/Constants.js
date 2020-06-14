
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
export const MIDDLETIER_URL = "http://localhost:3000/graphql";

// this is for lightsail Server
// export const MIDDLETIER_URL = "http://15.165.150.23/graphql";

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

export const cartCalculation = (items = [], deliveryFee = 0) => {
  let result = {}
  let subTotal = 0;
  let total = 0;

  items.map((anItem)=>{
    subTotal += (anItem.price * anItem.qty)
  })

  total = subTotal + deliveryFee;
  result = {
    items: items,
    deliveryFee: deliveryFee,
    total: total,
    subTotal: subTotal
  }


console.log('itemsitems',items)
  if (stockLocation == '1') {
    /*
    A 5 草 free 1 皇室 SXB 15
    B 5 草 free 2 皇室 SXB 30
    C 5 草 free 3 皇室 SXB 55
    D 5 草 free 4 皇室 SXB 70
    E 5 草 free 5 皇室 SXB 90

    weight max 2kg
    0~1 80
    1~2 96

    order charges
    {
      value: Float,

    }
    */

    let promotion = {
      code: "MS"
    }

    // delivery calculation options
    // static
    // by weight (conditions)
    // by total price (conditions)
    const calcOptions = [
      {

      }
    ]
    // order calculation methods
    let maxWeight = 2000;
    const deliveryMethod1 = () => {
      const ranges = [
        {

        }
      ]
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
