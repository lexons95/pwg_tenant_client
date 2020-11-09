
import React, { useState, useEffect } from 'react';
import { Drawer, Button, Avatar, Table, Descriptions, Typography, Popconfirm, Collapse, Form, Input, Space, Checkbox, Modal } from 'antd';
import { PlusOutlined, MinusOutlined, InfoCircleOutlined, CheckOutlined} from '@ant-design/icons';
import { useQuery, useLazyQuery, useMutation, gql } from "@apollo/client";
import { format, isAfter } from 'date-fns';

import { defaultImage_system, configId } from '../../../utils/Constants';
import { handlePromotionsChecking, checkActivePromotions, cartCalculation, plusItemQty, minusItemQty, removeItemFromCart } from '../../../utils/cartController';
import { useConfigCache, useCartCache, setCartCache, useProductsQuery, useCustomerCache, setCustomerCache } from '../../../utils/customHook';
import { showMessage } from '../../../utils/component/notification';
import Loading from '../../../utils/component/Loading';
import OrderInfo from './OrderInfo';

const { Search } = Input;
const { Paragraph, Text } = Typography;
const { Panel } = Collapse;

const GET_PROMOTIONS_QUERY = gql`
  query promotions($filter: JSONObject, $configId: String) {
    promotions(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      name
      description
      published
      startDate
      endDate
      type
      code
      quantity
      categories
      products
      minPurchases
      minQuantity
      minWeight
      rewardType
      discountValue
    }
  }
`;

const CREATE_ORDER_QUERY = gql`
  mutation createOrder($order: JSONObject!, $configId: String) {
    createOrder(order: $order, configId: $configId) {
      success
      message
      data
    }
  }
`;

const CHECK_CART_QUERY = gql`
  query checkCart($configId: String!, $items: [JSONObject!], $promoCode: String) {
    checkCart(configId: $configId, items: $items, promoCode: $promoCode) {
      success
      message
      data
    }
  }
`;

const CartDrawer = (props) => {
  const { drawerVisible, closeDrawer } = props;
  const configCache = useConfigCache();
  const cartCache = useCartCache();
  const customerCache = useCustomerCache();
  const [ selectedItemRowKeys, setSelectedItemRowKeys ] = useState([]);
  const [ cartItems, setCartItems ] = useState([]);
  const [ promoCodeInput, setPromoCodeInput ] = useState("");
  const [ promoCode, setPromoCode ] = useState("");
  const [ promoCodeStatus, setPromoCodeStatus ] = useState(null);
  const [ form ] = Form.useForm();

  const [ orderModalDisplay, setOrderModalDisplay ] = useState(false);
  const [ selectedOrder, setSelectedOrder ] = useState(null);

  const [ cartStockError, setCartStockError ] = useState([]);
  const [ currentCollapsePanel, setCurrentCollapsePanel ] = useState('1');

  // const productsResult = useProductsQuery();

  useEffect(()=>{
    setCartStockError([])
  },[])
  useEffect(()=>{
    if (cartCache && cartCache.items) {
      setCartItems(cartCache.items)
    }
  },[cartCache]);

  useEffect(()=>{
    if (customerCache) {
      form.setFieldsValue(customerCache)
    }
  },[customerCache]);

  useEffect(()=>{
    setPromoCodeInput("")
    setPromoCode("");
    setPromoCodeStatus({})
  }, [cartItems])

  const { data: promotionsData, loading: promotionsLoading, refetch: refetchPromotions } = useQuery(GET_PROMOTIONS_QUERY,{
    fetchPolicy: "cache-and-network",
    variables: {
      filter: {
        filter: {
          published: true
        },
        sorter: {
          createdAt: -1
        }
      },
      configId: configId
    },
    skip: configId ? false : true,
    onError: (error) => {
      console.log("promotions error", error)
    },
    onCompleted: (result) => {
      // console.log('fetched promotions', result)
    }
  })

  let promotions = promotionsData && promotionsData.promotions ? promotionsData.promotions : []

  const [ checkCart, { data: checkCartData, loading: checkCartLoading }] = useLazyQuery(CHECK_CART_QUERY,{
    onCompleted: (result) => {
      if (result && result.checkCart && result.checkCart.success) {
        let formValues = form.getFieldsValue()
        onSubmit(formValues)
      }
    }
  });

  const [ createOrder, { loading: loadingCreateOrder } ] = useMutation(CREATE_ORDER_QUERY,{
    onCompleted: (result) => {
      if (result && result.createOrder) {
        if (result.createOrder.success) {
          // console.log('createOrder result',result)
          setCartCache({items: []});
          handleOrderModalDisplayOpen(result.createOrder.data)
          showMessage({type:'success',message:"下单成功"});
          closeDrawer();
          setCurrentCollapsePanel('1')
        }
        else {
          showMessage({type:'error',message:"下单失败"});
          if (result.createOrder.data.items && result.createOrder.data.items.length > 0) {
            setCartStockError(result.createOrder.data.items)
            setCurrentCollapsePanel('1')
          }
        }
      }
      else {
        showMessage({type:'error',message:"下单失败"})
      }
    }
  })

  const handleOrderModalDisplayOpen = (selectedOrder) => {
    setOrderModalDisplay(true);
    setSelectedOrder(selectedOrder)
  }
  const handleOrderModalDisplayClose = () => {
    setOrderModalDisplay(false);
    setSelectedOrder(null)
  }

  const cartTableCol = [
    {
        title: '名字',
        key: 'variant',
        dataIndex: 'variant',
        render: (text, record) => {
          let imageLink = defaultImage_system;
          if (record.product.image) {
            imageLink = configCache.imageSrc + record.product.image;
          }
          let variantKeys = Object.keys(record.variant);
          let variantLabel = "";
          variantKeys.map((aKey, index)=>{
            let aVariant = record.variant[aKey];
            variantLabel += `${aVariant.name} - ${aVariant.value}` + ((variantKeys.length - 1 == index) ? "" : " , ")
          })

          let errorItem = null;
          if (cartStockError.length > 0) {
            let foundItem = cartStockError.find((anErrorItem)=>anErrorItem.inventoryId == record.inventoryId);
            if (foundItem) {
              errorItem = foundItem;
            }
          }

          return (
              <React.Fragment>
                <Avatar src={imageLink} size="large" shape="square"/>
                <div>
                    <Paragraph ellipsis={{rows: 2, expandable: false}} style={{marginBottom: 0}}>
                      {record.product.name}
                    </Paragraph>
                    <Paragraph style={{marginBottom: 0}}>
                      <Text type="secondary">{variantLabel}</Text>
                    </Paragraph>
                    {
                      errorItem != null && (errorItem.stock - record.qty < 0) ? (
                        <Paragraph style={{marginBottom: 0}}>
                          <Text type="secondary" style={{color:'red'}}>库存不足 (剩余{errorItem.stock}个)</Text>
                        </Paragraph>
                      ) : null
                    }
                    {
                      errorItem != null && !(errorItem.stock - record.qty < 0) ? (
                        <Paragraph style={{marginBottom: 0}}>
                          <Text type="secondary" style={{color:'red'}}>已下架</Text>
                        </Paragraph>
                      ) : null
                    }
                </div>
              </React.Fragment>
          )
        }
    },
    {
      title: '',
      key: 'price',
      dataIndex: 'price',
      render: (text, record) => {
        const handlePlusQty = () => {
          let plusResult = plusItemQty(cartItems, record.inventoryId, 1);
          if (plusResult.success) {
            setCartItems(plusResult.data)
          }
          // console.log('plusResult',plusResult)
        }
        const handleMinusQty = () => {
          let minusResult = minusItemQty(cartItems, record.inventoryId, 1);
          if (minusResult.success) {
            setCartItems(minusResult.data)
          }
        }
        return (
          <Space direction="vertical">
            {
              record.onSale && record.salePrice ? 
              (<div style={{display: 'flex'}}><span style={{color: 'rgb(255,117,0)', fontWeight: 'bold'}}>{configCache.currencyUnit} {record.salePrice}</span>&nbsp;<del style={{opacity: 1, color: 'rgb(161, 175, 201)'}}><div>{configCache.currencyUnit} {record.price}</div></del> /个</div>)
              : (<span>{`${configCache.currencyUnit} ${text}`}/个</span>)
            }
            <Space align="center">
              <Button shape="circle" icon={(<MinusOutlined/>)} onClick={handleMinusQty}/>
              <span>{record.qty}</span>
              <Button shape="circle" icon={(<PlusOutlined/>)} onClick={handlePlusQty}/>
            </Space>
            {/* <Input
              min={1}
              addonBefore={<MinusOutlined onClick={handleMinusQty} />}
              addonAfter={<PlusOutlined onClick={handlePlusQty} />}
              type="number"
              disabled={true}
              value={record.qty}
              style={{width:"150px"}}
            /> */}
          </Space>
        )
      }
    }
]
  const onSelectItemChange = (selectedItemRowKeys) => {
    setSelectedItemRowKeys(selectedItemRowKeys);
  }

  const rowSelection = {
    selectedItemRowKeys,
    onChange: onSelectItemChange,
  };

  function deliveryFeeInfo() {
    Modal.info({
      title: '邮费',
      content: (
        <div>
          <table style={{width:'100%'}}>
            <tbody>
              <tr>
                <td>一律 {configCache.currencyUnit + configCache.delivery}</td>
              </tr>
              <tr>
                <td>买满 {configCache.currencyUnit}125 免邮费</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
      maskClosable: true,
      onOk() {},
    });
  }

  // runCheckPromotion(promoCode)
  let passedPromotions = handlePromotionsChecking(cartItems, promotions, promoCode);
  // let {allowOrder, totalWeight, ...cartCalculationResult} = cartCalculation(cartItems, deliveryFee, []);
  let {allowOrder, totalWeight, ...cartCalculationResult} = cartCalculation(cartItems, passedPromotions);

  const cartTableFooter = () => {

    const handleDeleteItems = () => {
      removeItemFromCart(cartItems,selectedItemRowKeys);
      setSelectedItemRowKeys([]);
      showMessage({type:'success',message:"删除成功"})
    }

    const handlePromoCodeChange = (e) => {
      setPromoCodeInput(e.target.value.toUpperCase())
      setPromoCodeStatus({})
    }

    const handleCheckActivePromo = (value) => {
      setPromoCodeStatus({})
      refetchPromotions().then(result=>{
        let refetchedPromotions = result && result.data && result.data.promotions ? result.data.promotions : promotions
        let passedActive = checkActivePromotions(cartItems, refetchedPromotions, value)
        if (passedActive && passedActive.length > 0) {
          setPromoCode(value)
          setPromoCodeStatus({
            validateStatus: "success",
            help: "使用成功"
          })
        }
        else {
          setPromoCodeStatus({
            validateStatus: "error",
            help: "无法使用"
          })
        }
      }).catch((refetchError)=>{
        setPromoCodeStatus({})
      })

    }

    return (
        <>
            <div className="cartDrawer-summary-footer">
              <div style={{marginBottom: '5px'}}>
                <Popconfirm
                  title="确定删除已选?"
                  onConfirm={handleDeleteItems}
                  onCancel={()=>{}}
                  okText="确定"
                  cancelText="取消"
                  disabled={selectedItemRowKeys.length <= 0}
                >
                    <Button type="danger" size="small" disabled={selectedItemRowKeys.length <= 0}>删除已选</Button>
                </Popconfirm>
              </div>

              <Descriptions
                  bordered={true}
                  size="small"
                  column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}
                  style={{maxWidth:"100%"}}
              >
                  <Descriptions.Item label="优惠卷">
                    <Form.Item 
                      {...promoCodeStatus}
                    >
                      <Search enterButton={(<CheckOutlined/>)} onSearch={handleCheckActivePromo} value={promoCodeInput} onChange={handlePromoCodeChange} />
                    </Form.Item>
                  </Descriptions.Item>
                  <Descriptions.Item label="小计">{cartCalculationResult.subTotal}</Descriptions.Item>
                  <Descriptions.Item label={(<span style={!allowOrder?{color:'red'}:{}}>邮费 ({(totalWeight/1000)}kg) <InfoCircleOutlined onClick={deliveryFeeInfo} /></span>)}>{cartCalculationResult.deliveryFee}</Descriptions.Item>
                  {
                    cartCalculationResult.charges.map((aCharge,index)=>{
                      let label = "";
                      let color = "green"
                      if (aCharge.rewardType == 'percentage') {
                        label = `-${aCharge.discountValue}%`
                      }
                      else if (aCharge.rewardType == 'fixedAmount') {
                        label = `-${aCharge.discountValue}`
                      }
                      else if (aCharge.rewardType == 'freeShipping') {
                        label = `-${cartCalculationResult.deliveryFee}`
                      }
                      else if (aCharge.rewardType == 'freeGift') {
                        label = aCharge.description
                      }
                      else if (aCharge.rewardType == 'charges') {
                        label = `+${aCharge.discountValue}`
                        color = "grey"
                      }
                      let popupInfo = () => {
                        Modal.info({
                          title: aCharge.name,
                          content: (
                            <div>
                              {aCharge.description}
                            </div>
                          ),
                          maskClosable: true,
                          onOk() {},
                        });
                      }
                      return <Descriptions.Item key={index} label={(<span>{aCharge.name} {aCharge.description ? <InfoCircleOutlined onClick={popupInfo} /> : null}</span>)} style={{color:color}}>{label}</Descriptions.Item>
                    })
                  }
                  <Descriptions.Item label={`总计 (${configCache.currencyUnit})`}>{cartCalculationResult.total}</Descriptions.Item>
              </Descriptions>
            </div>
        </>
    )
  }

  let submitDisabled = cartItems.length > 0 && !loadingCreateOrder && allowOrder ? false : true;

  const onSubmit = (values) => {
    const { remark, ...restValues } = values;
    let finalItems = cartItems.map((anItem)=>{
      const { stock, ...restItem } = anItem;
      return restItem
    })
    let orderObj = {
      items: finalItems,
      type: cartCalculationResult.type,
      total: cartCalculationResult.total,
      charges: cartCalculationResult.charges,
      subTotal: cartCalculationResult.subTotal,
      deliveryFee: cartCalculationResult.deliveryFee,
      customer: restValues,
      remark: remark
    }
    if (!submitDisabled) {
      createOrder({
        variables: {
          order: orderObj,
          configId: configId
        }
      })
    }
    setCustomerCache(restValues);
  }

  const handleCheckCart = () => {
    checkCart({
      variables:{
        configId: configCache.configId,
        items: cartItems,
        promoCode: promoCode
      }
    })
  }

  //let formInitialValues = customerCache ? customerCache : {}


  return (
    <Drawer
      title="购物车"
      placement="right"
      closable={true}
      onClose={closeDrawer}
      visible={drawerVisible}
      bodyStyle={{padding: 0}}
      //width={'auto'}
      className="cartDrawer"
      //drawerStyle={{maxWidth:'100%'}}
      footer={(
        <div className="cartDrawer-footer">
          <Space>
            <Button onClick={()=>{form.resetFields()}}>重置</Button>
            <Button type="primary" onClick={()=>{form.submit()}} disabled={submitDisabled}>下单</Button>
          </Space>
        </div>
      )}
    >
      <div className="cartDrawer-content-wrapper">
        {
          cartCache ? (
            <Collapse
              bordered={false}
              //defaultActiveKey={['1','2']}
              expandIconPosition="right"
              activeKey={currentCollapsePanel}
              accordion
              onChange={(value)=>{
                setCurrentCollapsePanel(value)
              }}
            >
              <Panel
                //header={(<Button type="link">产品列表</Button>)}
                header={"产品列表"}
                key="1"
              >
                <Table
                  rowKey="inventoryId"
                  columns={cartTableCol}
                  dataSource={cartItems}
                  pagination={false}
                  size="small"
                  rowSelection={rowSelection}
                  footer={() => cartTableFooter()}
                />
              </Panel>
              <Panel
                //header={(<Button type="link" disabled={submitDisabled}>下一步</Button>)}
                header={"下一步"}
                key="2"
                disabled={submitDisabled}
              >
                <Form
                  form={form}
                  layout={'vertical'}
                  onFinish={handleCheckCart}
                  //initialValues={formInitialValues}
                >
                  <Form.Item name={'name'} label={'名字'} rules={[{ required: true, message:"请输入名字" }]}>
                    <Input/>
                  </Form.Item>
                  <Form.Item name={'contact'} label={'电话号码'} rules={[{ required: true, message:"请输入电话号码" }]}>
                    <Input/>
                  </Form.Item>
                  <Form.Item name={'address'} label={'收件地址'} rules={[{ required: true, message:"请输入地址" }]}>
                    <Input.TextArea/>
                  </Form.Item>
                  <Space>
                    <Form.Item name={'postcode'} label={'邮编'} rules={[{ required: true, message:"请输入邮编" }]}>
                      <Input/>
                    </Form.Item>
                    <Form.Item name={'province'} label={'省份'} rules={[{ required: true, message:"请输入省份" }]}>
                      <Input/>
                    </Form.Item>
                  </Space>
                  <Form.Item name={'remark'} label={"备注"}>
                    <Input.TextArea
                      defaultValue={""}
                      rows={4}
                    />
                  </Form.Item>
                </Form>
              </Panel>
            </Collapse>

          ) : null
        }

      </div>

      <OrderInfo
        order={selectedOrder}
        visible={orderModalDisplay}
        closeModal={handleOrderModalDisplayClose}
      />
      {
        loadingCreateOrder || checkCartLoading ? <Loading/> : null
      }
    </Drawer>
  )
}

export default CartDrawer;
