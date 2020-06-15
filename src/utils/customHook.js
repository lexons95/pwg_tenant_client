import React from 'react';
import { useState, useEffect } from 'react';
import gql from "graphql-tag";
import { useQuery, useMutation, useApolloClient } from "@apollo/react-hooks";

import { configId, stockLocation } from './Constants';
// const GET_PRODUCTS_QUERY = gql`
//   query () {
//     products() {

//     }
//   }
// `;

export const useCustomQuery = (query, options={}) => {
  const { data, error, loading } = useQuery(query,options);
  if (loading) {

  }
  if (error) {
    console.log('useCustomQuery error: ', error)
    return null;
  }

  return data;
}

export const useCustomMutation = (query, options={}) => {
  const [ runMutationFunc, { data, loading, error }] = useMutation(query,options);

  const handleMutationFunc = async (options2) => {
    try {
      const result = await runMutationFunc(options2);
      return result;
    } catch (error2) {
      console.log(error2.graphQLErrors)
    }
  };

  return {
    run: handleMutationFunc,
    data: data,
    loading: loading,
    error: error
  };
};

const addConfigIdVariable = (options) => {
  let result = {...options};
  if (result.variables) {
    result['variables']['configId'] = configId;
    if (result['variables']['filter']) {
      if (result['variables']['filter']['filter']) {
        result['variables']['filter']['filter']['published'] = true;
        result['variables']['filter']['filter']['type'] = stockLocation;
      }
      else {
        result['variables']['filter'] = {
          filter: {
            published: true,
            type: stockLocation
          }
        }
      }
    }
    else {
      result['variables']['filter'] = {
        filter: {
          published: true,
          type: stockLocation
        }
      }
    }
  }
  else {
    result['variables'] = { 
      filter: {
        filter: {
          published: true,
          type: stockLocation
        }
      },
      configId: configId 
    };
  }
  return result;
}

const GET_PRODUCTS_QUERY = gql`
  query products($filter: JSONObject, $configId: String!) {
    products(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      name
      description
      type
      category
      tags
      variants
      published
      images
    }
  }
`;

export const useProductsQuery = (options={}) => {
  let newOptions = addConfigIdVariable(options);
  const { data, error, loading } = useQuery(GET_PRODUCTS_QUERY,newOptions);
  if (loading) {
    return null;
  }
  if (error) {
    console.log('useProductsQuery error: ', error)
    return null;
  }

  return data.products;
}

const GET_INVENTORY_QUERY = gql`
  query inventory($filter: JSONObject, $configId: String) {
    inventory(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      price
      stock
      variants
      published
      productId
    }
  }
`;

export const useInventoryQuery = (options={}) => {
  let newOptions = addConfigIdVariable(options);
  const { data, error, loading } = useQuery(GET_INVENTORY_QUERY,newOptions);
  if (loading) {

  }
  if (error) {
    console.log('useInventoryQuery error: ', error)
    return null;
  }

  return data.inventory;
}