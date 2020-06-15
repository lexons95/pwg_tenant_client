import React, {useState, useEffect, useRef} from 'react';
import { Modal, Carousel, Select, Button, Input, Divider, Empty, Form, Tag, message } from 'antd';
import { LeftOutlined, RightOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { useLazyQuery } from "@apollo/react-hooks";
import gql from 'graphql-tag';

import { useConfigCache, setCartCache, useCartCache, getInventoryVariants, configId } from '../../../utils/Constants';
import { showMessage } from '../../../utils/component/notification';
import LightboxModal from '../../../utils/component/LightboxModal';
import Loading from '../../../utils/component/Loading';

const { Option } = Select;

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

const getCategoryInfo = (categoryArray=[]) => {
  let result = "";
  categoryArray.map((aCategory, index)=>{
    result += aCategory.name + ((categoryArray.length - 1 == index) ? "" : " / ");
  })
  return result;
}

const ProductInfo = (props) => {
  const { product, categories = [], modalVisible, refetch, closeModal } = props;
  const configCache = useConfigCache();
  const [ form ] = Form.useForm();
  let carouselRef = useRef(null);
  const [ inventoryData, setInventoryData ] = useState([]);
  const [ selectedInventory, setSelectedInventory ] = useState(null);

  const [ lightboxVisible, setLightboxVisible ] = useState(false);
  const [ lightboxIndex, setLightboxIndex ] = useState(null);

  const cartCache = useCartCache();

  const [ readInventory, { error, loading: loadingInventory } ] = useLazyQuery(READ_PRODUCT_INVENTORY_QUERY,{
    fetchPolicy: "cache-and-network",
    onCompleted: (result) => {
      if (result && result.inventory) {
        let flattenedInventory = [];
        result.inventory.map((anInventory,index)=>{
          const { variants, ...restInventory } = anInventory;
          let newInventory = {...restInventory, ...variants, key: restInventory._id};
          flattenedInventory.push(newInventory);
        })
        // console.log('result.inventory',result.inventory)
        setInventoryData(result.inventory);
      }

    },
    onError: (error) => {
      console.log('error:: ',error)
    }
  })

  useEffect(() => {
    if (product && modalVisible) {
      readInventory({
        variables: {
          filter: {
            filter: {
              productId: product._id,
              published: true
            }
          },
          configId: configId
        }
      });
    }
    
  }, [product, modalVisible]);

  const getProductImages = () => {

    const imageComponent = (src, key) => {
      return (
        <div key={key} className="aspect-ratio-1-1" onClick={()=>{
            setLightboxVisible(true)
            setLightboxIndex(key)
            }}>
          <div className="aspect-ratio-wrapper" style={{display:'flex', alignItems:'center'}}>
            <img src={src} style={{width:'100%'}} />
          </div>
        </div>
      )
      // return (
      //   <div key={index} className="productInfo-main-carousel-item">
      //     <img src={src} style={{width:'100%'}} />
      //   </div>
      // )
    }
    let result = [];
    let links = []
    if (product && product.images && product.images.length > 0) {
      product.images.map((anImage, index)=>{
        let src = configCache.imageSrc + anImage.name;
        if (anImage.fav) {
          links.unshift(src)
        }
        else {
          links.push(src)
        }
      })

      links.map((aLink,index)=>{
        result.push(imageComponent(aLink, index))
      })
    }
    if (result.length == 0) {
      result.push(imageComponent(configCache.defaultImage, 'noImage'))
    }
    return {
      data: result,
      links: links
    };
  }

  const prevSlide = () => {
    carouselRef.prev();
  }
  const nextSlide = () => {
    carouselRef.next();
  }

  const getAddToCartForm = () => {
    const getDefaultPrices = () => {
      let minPrice = 0;
      let maxPrice = 0;

      inventoryData.map((anInventory, index)=>{
        if (index == 0) {
          minPrice = anInventory.price
          maxPrice = anInventory.price
        }
        else {
          if (anInventory.price < minPrice) {
            minPrice = anInventory.price
          }
          if (anInventory.price > maxPrice) {
            maxPrice = anInventory.price
          }
        }
      });
      return {
        min: minPrice,
        max: maxPrice,
        same: minPrice == maxPrice
      }
    }

    const onSelectChanged = (value) => {
      let foundInventory = inventoryData.find((anInventory)=>{ return anInventory._id == value });
      if (foundInventory) {
        setSelectedInventory(foundInventory)
      }
      else {
        setSelectedInventory(null)
      }
      form.setFieldsValue({'qty': 1});
    }

    const getVariantFieldsSelect = () => {
      let options = [];
      inventoryData.map((anInventory, index)=>{
        let withStock = anInventory.stock && anInventory.stock > 0 ? true : false;
        let variantsResult = getInventoryVariants(product.variants, anInventory.variants)
        options.push(
          <Option key={index} value={anInventory._id} disabled={!withStock}><div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'space-between', whiteSpace:'break-spaces', width: '100%'}}>
            {variantsResult.label + (withStock ? ` (还剩${anInventory.stock}个)` : ` (暂无)`)} 
            <div>{configCache.currencyUnit} {anInventory.price}<sub>/个</sub></div></div>
          </Option>
        )
      })
      return (
        <Form.Item name="inventory" rules={[{ required: true, message:"请选择一个选项" }]} style={{marginBottom:"10px"}}>
          <Select placeholder="点这选择" onChange={onSelectChanged} allowClear={true}>
            {options}
          </Select>
        </Form.Item>
      )
    }

    const handlePlusQty = () => {
      let currentQty = form.getFieldValue('qty');
      let resultQty = currentQty + 1;
      if (selectedInventory) {
        if (resultQty > selectedInventory.stock) {
          resultQty = selectedInventory.stock;
        }
      }
      form.setFieldsValue({
        'qty': resultQty
      });
    }
    const handleMinusQty = () => {
      let currentQty = form.getFieldValue('qty');
      let resultQty = currentQty - 1;
      if (selectedInventory) {
        if (resultQty < 1) {
          resultQty = 1;
        }
      }
      form.setFieldsValue({
        'qty': resultQty
      });
    }

    let defaultPrices = getDefaultPrices();
    let disableQtyInput = selectedInventory ? false : true;
    let qtyBtnStyle = {
      cursor:'pointer'
    }
    if (disableQtyInput) {
      qtyBtnStyle = {
        cursor:'not-allowed',
        pointerEvents: 'none',
        color: 'rgba(0, 0, 0, 0.25)'
      }
    }

    return (
      <Form 
        form={form} 
        onFinish={onAddToCart} 
        initialValues={{
          qty: 1
        }}
        //labelCol={{ span: 5 }} 
        //wrapperCol={{ span: 16 }} 
      >
        <div style={{marginBottom:"10px"}}>{configCache.currencyUnit} {selectedInventory ? <>{selectedInventory.price}<sub>/个</sub></> : defaultPrices.same ? defaultPrices.min : `${defaultPrices.min} ~ ${defaultPrices.max}`}</div>
        {getVariantFieldsSelect()}
        <div style={{display:"flex","flexWrap":"nowrap"}}>
          <Form.Item name="qty" rules={[{ required: true, message:"请输入数量" }]} style={{marginBottom:0, marginRight:"10px", flexGrow: 1}}>
            <Input
              min={1} 
              //max={50}
              addonBefore={<MinusOutlined onClick={handleMinusQty} style={qtyBtnStyle} />}
              //addonBefore={<Button icon={<MinusOutlined/>} onClick={handleMinusQty} disabled={selectedInventory ? false : true}/>}
              addonAfter={<PlusOutlined onClick={handlePlusQty} style={qtyBtnStyle} />}
              //addonAfter={<Button icon={<PlusOutlined/>} onClick={handlePlusQty} style={{width: '100%'}} disabled={selectedInventory ? false : true}/>}
              type="number"
              disabled={disableQtyInput}
            />
          </Form.Item>
          <Button type="primary" disabled={false} onClick={()=>{form.submit()}} style={{flexGrow: 1}}>加入购物车</Button>
        </div>
      </Form>
    )
  }

  const onAddToCart = (values) => {

    form.validateFields()
    .then(values => {
      if (cartCache) {
        let newCartObj = {...cartCache};
        let newCartItems = [...newCartObj.items];
        let foundInventory = inventoryData.find((anInventory)=>{return anInventory._id == values.inventory});

        let foundAddedItem = cartCache.items.find((anAddedItem)=>{return anAddedItem.inventoryId == values.inventory});
        if (foundAddedItem) {
          if (foundInventory) {
            let newQty = foundAddedItem.qty + values.qty;
            if (newQty > foundInventory.stock) {
              newQty = foundInventory.stock;
            }
            newCartItems = newCartItems.map((anItem)=>{
              if (anItem.inventoryId == values.inventory) {
                if (newQty <= foundInventory.stock) {
                  anItem['qty'] = newQty;
                  anItem['stock'] = foundInventory.stock;
                  return anItem;
                }
              }
              else {
                return anItem;
              }
            })
            newCartObj['items'] = newCartItems;
            setCartCache(newCartObj);
            message.success('添加成功');
            // showMessage({type:'success',message:"添加成功"});
            
          }
          else {
            message.error('添加失败');
            // showMessage({type:'error',message:"添加失败"});
          }
        }
        else {
          if (foundInventory) {
            let productFavImage = product.images.length > 0 ? product.images.find((anImage)=>anImage.fav) : null;
            let variantsResult = getInventoryVariants(product.variants, foundInventory.variants);
            let newCartItem = {
              inventoryId: values.inventory,
              qty: values.qty,
              weight: foundInventory.weight,
              price: foundInventory.price,
              stock: foundInventory.stock,
              product: {
                _id: product._id,
                name: product.name,
                type: product.type,
                category: product.category.length > 0 ? product.category[0].name : "",
                image: productFavImage ? productFavImage.name : ""
              },
              variant: variantsResult.variants
            }
            newCartItems.push(newCartItem);
            newCartObj['items'] = newCartItems;
            setCartCache(newCartObj);
            message.success('添加成功');
            // showMessage({type:'success',message:"添加成功"});
          }
          else {
            message.error('添加失败');
            // showMessage({type:'error',message:"添加失败"});
          }
        }
      }
    })
    .catch(errorInfo => {
      /*
      errorInfo:
        {
          values: {
            username: 'username',
            password: 'password',
          },
          errorFields: [
            { password: ['username'], errors: ['Please input your Password!'] },
          ],
          outOfDate: false,
        }
      */
    });
  }

  let images = product ? getProductImages() : {
    data: [],
    links: []
  };

  let footer = loadingInventory ? <Loading/> : (
    inventoryData.length > 0 ? getAddToCartForm() : null
  )

  return (
    <Modal
      title={product ? product.name : ""}
      width={'99%'}
      visible={modalVisible}
      onCancel={closeModal}
      destroyOnClose
      wrapClassName={'products-modalWrapper'}
      style={{overflow:"hidden"}}
      footer={footer}
      //footer={null}
    >
      <div className="productInfo-modal-bodyWrapper">
      {
        product ? (
          <div className="productInfo-main">
            <div className="productInfo-main-media-container">
              <div className="aspect-ratio-1-1 productInfo-main-carousel-container">
                <div className="aspect-ratio-wrapper">
                  <Carousel
                    className="productInfo-main-carousel"
                    ref={(ref)=>{carouselRef = ref}}
                  >
                    {images.data}
                  </Carousel>
                  {
                    product.images.length > 1 ? (
                      <React.Fragment>
                        <div className="productInfo-main-carousel-actions productInfo-main-carousel-prev" onClick={prevSlide}><LeftOutlined /></div>
                        <div className="productInfo-main-carousel-actions productInfo-main-carousel-next" onClick={nextSlide}><RightOutlined /></div>
                        <div className="productInfo-main-carousel-dots-container"></div>
                      </React.Fragment>
                    ) : null
                  }
                </div>
              </div>

              <LightboxModal
                images={images.links}
                visible={lightboxVisible}
                handleClose={()=>{setLightboxVisible(false)}}
                initialIndex={lightboxIndex}
              />
            </div>
            <div className="productInfo-main-description">
              <Divider orientation="left">产品详情</Divider>
              {/* <b>产品详情</b> */}
              {
                product.tags && product.tags.length > 0 ? (
                  <div style={{marginBottom: '10px'}}>
                    {
                      product.tags.map((aTag, index)=>{
                        return <Tag key={index}>{aTag}</Tag>
                      })
                    }
                  </div>
                ) : null 
              }
              <div>{getCategoryInfo(product.category)}</div>
              {product.description}
              {/* {inventoryData.length > 0 ? getAddToCartForm() : null} */}
              
            </div>
          </div>
        ) : <Empty/>
      }
      </div>
    
    </Modal>
  )
}

export default ProductInfo;