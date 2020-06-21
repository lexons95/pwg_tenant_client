import React, {useState} from 'react';
import { useQuery } from "@apollo/react-hooks";
import gql from 'graphql-tag';
import { Button, Empty } from 'antd';
import { useParams } from 'react-router-dom';

import ProductCard from './component/ProductCard';
import ProductInfo from './component/ProductInfo';
import { configId } from '../../utils/Constants';
import Loading from '../../utils/component/Loading';
import { useConfigCache, useProductsQuery } from '../../utils/customHook';

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
  const productsResult = useProductsQuery();

  const { data: inventoryData, loading: loadingInventory, error: inventoryError, refetch: refetchInventory } = useQuery(READ_PRODUCT_INVENTORY_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: {
      filter: {
        filter: {
          published: true
        }
      },
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

  if (productsResult == null) return null;

  let categoryId = null;
  if (Object.keys(routerParams).length > 0) {
    categoryId = routerParams['_id'];
  }
  
  const getProducts = (items) => {
    let result = [];

    items.map((aProduct, index)=>{
      let foundInventories = [];
      if (inventoryData && inventoryData.inventory) {
        foundInventories = inventoryData.inventory.filter((anInventory)=>{
          return anInventory.productId == aProduct._id;
        })
      } 
      
      if (categoryId != null) {
        if (aProduct.category.length > 0) {
          let foundCategory = aProduct.category.find((aCategory)=>{
            let key = aCategory._id ? aCategory._id : null;
            return key == categoryId;
          })
          if (foundCategory) {
            result.push(
              <li key={index} className="products-card-item">
                <ProductCard product={aProduct} inventory={foundInventories} onClick={()=>{handleOnClickProduct(aProduct)}}/>
              </li>
            )
          }
        }
      }
      else {
        result.push(
          <li key={index} className="products-card-item">
            <ProductCard product={aProduct} inventory={foundInventories} onClick={()=>{handleOnClickProduct(aProduct)}}/>
          </li>
        )

      }
    })
    return result;
  }

  let getProductsResult = getProducts(productsResult);
  return (
    <div>
      <div style={{textAlign:'left', margin: '16px 0 0 16px'}}>Found {getProductsResult.length} items</div>
      {
        productsResult.length > 0 && getProductsResult.length > 0 ?
          <ul className="products-container">
            {getProductsResult}
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