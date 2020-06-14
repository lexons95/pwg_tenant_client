import React, {useState} from 'react';
import { useQuery } from "@apollo/react-hooks";
import gql from 'graphql-tag';
import { Button, Empty } from 'antd';
import { useParams } from 'react-router-dom';

import ProductCard from './component/ProductCard';
import ProductInfo from './component/ProductInfo';
import { useConfigCache, configId, stockLocation } from '../../utils/Constants';
import Loading from '../../utils/component/Loading';

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

const READ_PRODUCT_INVENTORY_QUERY = gql`
  query inventory($filter: JSONObject, $configId: String) {
    inventory(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      price
      stock
      weight
      variants
      published
      productId
    }
  }
`;

const Products = (props) => {
  const routerParams = useParams();
  const [ productInfoModal, setProductInfoModal ] = useState(false);
  const [ selectedProduct, setSelectedProduct ] = useState(null);
  const { data, error, loading } = useQuery(GET_PRODUCTS_QUERY,{
    variables: {
      filter: {
        filter: {
          published: true,
          type: stockLocation
        }
      },
      configId: configId
    }
  });

  const { data: inventoryData, loading: loadingInventory, error: inventoryError, refetch: refetchInventory } = useQuery(READ_PRODUCT_INVENTORY_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: {
      configId: configId
    },
    onError: (error) => {
      console.log("inventoryData error", error)
    },
    onCompleted: (result) => {
      // console.log('refetched inventory', result)
    }
  });
  
  const handleProductInfoModalOpen = () => {
    setProductInfoModal(true);
  }
  const handleProductInfoModalClose = () => {
    setProductInfoModal(false);
  }

  const handleOnClickProduct = (product) => {
    handleProductInfoModalOpen();
    setSelectedProduct(product)
  }

  if (loading) return "loading";
  if (error) return `error: ${error}`;

  let categoryId = null;
  if (Object.keys(routerParams).length > 0) {
    categoryId = routerParams['_id'];
  }
  
  const getProducts = (dataInput) => {
    let result = [];

    dataInput.products.map((aProduct, index)=>{
      if (categoryId != null) {
        if (aProduct.category.length > 0) {
          let foundCategory = aProduct.category.find((aCategory)=>{
            let key = aCategory._id ? aCategory._id : null;
            return key == categoryId;
          })
          if (foundCategory) {
            result.push(
              <li key={index} className="products-card-item">
                <ProductCard product={aProduct} onClick={()=>{handleOnClickProduct(aProduct)}}/>
              </li>
            )
          }
        }
      }
      else {
        result.push(
          <li key={index} className="products-card-item">
            <ProductCard product={aProduct} onClick={()=>{handleOnClickProduct(aProduct)}}/>
          </li>
        )

      }
    })
    return result;
  }
  return (
    <div>
      {
        data.products.length > 0 && getProducts(data).length > 0 ?
          <ul className="products-container">
            {getProducts(data)}
          </ul>
          : 
          (
            <div style={{height: '70vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Empty description={'暂无'} />
            </div>
          )
      }
      {
        productInfoModal ? (
          <ProductInfo
            modalVisible={productInfoModal}
            product={selectedProduct}
            closeModal={handleProductInfoModalClose}
          />
        ) : null
      }
    </div>
  )
}

export default Products;