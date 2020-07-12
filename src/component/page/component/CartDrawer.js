
import React, { useState, useEffect } from 'react';
import { Drawer, Button, Avatar, Table, Descriptions, Typography, Popconfirm, Collapse, Form, Input, Space, Checkbox, Modal } from 'antd';
import { PlusOutlined, MinusOutlined, InfoCircleOutlined} from '@ant-design/icons';
import { useMutation } from "@apollo/react-hooks";
import gql from 'graphql-tag';

import { isBetween, cartCalculation, plusItemQty, minusItemQty, removeItemFromCart, defaultImage_system, configId } from '../../../utils/Constants';
import { useConfigCache, useCartCache, setCartCache, useProductsQuery, useCustomerCache, setCustomerCache } from '../../../utils/customHook';
import { showMessage } from '../../../utils/component/notification';
import Loading from '../../../utils/component/Loading';
import OrderInfo from './OrderInfo';

const { Paragraph, Text } = Typography;
const { Panel } = Collapse;

const giftPromotion = {
  code: "",
  name: "",
  description: "",
  defaultValue: 0,
  property: 'qty',
  filter: {
    "product.category": "手卷草"
  },
  operatorType: 'includeMax',
  conditions: [
    {
      name: 'A',
      value: 1,
      min: 4,
      max: 9
    },
    {
      name: 'B',
      value: 2,
      min: 9,
      max: 14
    },
    {
      name: 'C',
      value: 3,
      min: 14,
      max: 19
    },
    {
      name: 'D',
      value: 4,
      min: 19,
      max: 24
    },
    {
      name: 'E',
      value: 5,
      min: 24,
      max: 999
    }
  ]
}


let dutyTaxInsuranceConditions = {
  code: "dutyTaxInsurance",
  required: false,
  name: "税险包",
  defaultValue: 0,
  description: "",
  property: 'qty',
  filter: {
    "product.category": "手卷草"
  },
  operatorType: 'includeMax',
  conditions: [
    {
      name: 'A',
      value: 0,
      min: 0,
      max: 5
    },
    {
      name: 'B',
      value: 0,
      min: 5,
      max: 10
    },
    {
      name: 'C',
      value: 0,
      min: 10,
      max: 15
    },
    {
      name: 'D',
      value: 0,
      min: 15,
      max: 20
    },
    {
      name: 'E',
      value: 0,
      min: 20,
      max: null
    }
  ]
}

const CREATE_ORDER_QUERY = gql`
  mutation createOrder($order: JSONObject!, $configId: String) {
    createOrder(order: $order, configId: $configId) {
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
  const [ selectedRowKeys, setSelectedRowKeys ] = useState([]);
  const [ cartItems, setCartItems ] = useState([]);
  const [ form ] = Form.useForm();

  const [ orderModalDisplay, setOrderModalDisplay ] = useState(false);
  const [ selectedOrder, setSelectedOrder ] = useState(null);

  const [ cartStockError, setCartStockError ] = useState([]);
  const [ currentCollapsePanel, setCurrentCollapsePanel ] = useState('1');

  const [ acceptInsurance, setAcceptInsurance ] = useState(true);

  const productsResult = useProductsQuery();

  let deliveryFee = configCache && configCache.delivery ? configCache.delivery : 0;

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

  const [ createOrder, { loading: loadingCreateOrder } ] = useMutation(CREATE_ORDER_QUERY,{
    onCompleted: (result) => {
      if (result && result.createOrder) {
        if (result.createOrder.success) {
          console.log('createOrder result',result)
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
          console.log('plusResult',plusResult)
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
              record.onSale ? 
              (<div style={{display: 'flex'}}><span style={{color: 'rgb(255,117,0)', fontWeight: 'bold'}}>{configCache.currencyUnit} {record.salePrice}</span>&nbsp;<del style={{opacity: 1, color: 'rgb(161, 175, 201)'}}><div>{configCache.currencyUnit} {record.price}</div></del> /个</div>)
              : (<span>{`${configCache.currencyUnit} ${text}`}/个</span>)
            }
            <Input
              min={1}
              addonBefore={<MinusOutlined onClick={handleMinusQty} />}
              addonAfter={<PlusOutlined onClick={handlePlusQty} />}
              type="number"
              disabled={true}
              value={record.qty}
              style={{width:"150px"}}
            />
          </Space>
        )
      }
    }
]
  const onSelectChange = (selectedRowKeys) => {
    setSelectedRowKeys(selectedRowKeys);
    console.log('selectedRowKeys',selectedRowKeys)
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const dutyTaxInsurance = (items) => {

    let availableInsurance = dutyTaxInsuranceConditions.defaultValue;
    let availableFreeGift = giftPromotion.defaultValue;
    let totalQty = 0;
    if (productsResult && productsResult.length > 0) {
      let cartItemsProductIds = items.map((anItem)=>anItem.product._id)
      let foundProducts = productsResult.filter((aProduct)=>{
        if (cartItemsProductIds.indexOf(aProduct._id) >= 0) {
          if (aProduct.category && aProduct.category.length > 0) {
            if (aProduct.category[0].name == '手卷草') {
              return true;
            }
          }
        }
        return false;
      })
      let productIds = foundProducts.map((aProduct)=>aProduct._id);
      let foundItems = items.filter((anItem)=>{return productIds.indexOf(anItem.product._id) >= 0});

      if (foundItems.length > 0) {
        totalQty = foundItems.reduce((total, current)=>{
          return total + current.qty;
        }, 0)

        dutyTaxInsuranceConditions.conditions.forEach((aCondition)=>{
          if (isBetween(aCondition.min,aCondition.max,totalQty,dutyTaxInsuranceConditions.operatorType)) {
            availableInsurance = aCondition.value;
          }
        })

        giftPromotion.conditions.forEach((aCondition)=>{
          if (isBetween(aCondition.min,aCondition.max,totalQty,giftPromotion.operatorType)) {
            availableFreeGift = aCondition.value;
          }
        })

      }
    }
    let result = null;
    result = {
      sxb: availableInsurance,
      free: availableFreeGift,
      total: totalQty
    }
    return result;
  }

  let foundInsurance = dutyTaxInsurance(cartItems);
  function deliveryFeeInfo() {
    Modal.info({
      title: '邮费',
      content: (
        <div>
          <table style={{width:'100%'}}>
            <tbody>
              <tr>
                <th>最高重量</th>
                <th>3kg</th>
              </tr>
              <tr>
                <th>重量 (kg)</th>
                <th>价格 (RMB)</th>
              </tr>
              <tr>
                <td>0 ~ 1</td>
                <td>80</td>
              </tr>
              <tr>
                <td>1 ~ 2</td>
                <td>96</td>
              </tr>
              <tr>
                <td>> 2</td>
                <td>116</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
      maskClosable: true,
      onOk() {},
    });
  }
  function insuranceInfo() {
    Modal.info({
      title: '税险包（选择性收费）',
      content: (
        <div>
          <table style={{width:'100%'}}>
            <tbody>
              <tr key={'header'}>
                <th>套餐</th>
                <th>购买数量 (仅限手卷草)</th>
                <th>价格 (RMB)</th>
              </tr>
              {
                dutyTaxInsuranceConditions.conditions.map((aCondition,index)=>{
                  let msg = dutyTaxInsuranceConditions.operatorType == 'includeMax' ?
                    `${aCondition.min == null ? '或以下' : aCondition.min + 1} ~ ${aCondition.max == null ? '或以上' : aCondition.max} 包`
                    : `${aCondition.min == null ? '或以下' : aCondition.min} ~ ${aCondition.max == null ? '或以上' : aCondition.max - 1} 包`
                  return (
                    <tr key={index}>
                      <td>{aCondition.name}</td>
                      <td>{msg}</td>
                      <td>{aCondition.value}</td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      ),
      maskClosable: true,
      onOk() {},
    });
  }

  function freeGiftInfo() {
    Modal.info({
      title: '赠品（请在备注填写 口味名字/代号 和 数量）',
      content: (
        <div>
          <table style={{width:'100%'}}>
            <tbody>
              <tr>
                <th colSpan="2">
                  本次活动赠送产品是皇室系列手卷草，每种口味限定10包，送完为止，如果下单时预留的口味没有货的话，客服会联系进行调换。
                </th>
              </tr>
              <tr>
                <th>口味</th>
              </tr>
              <tr>
                <td>斯坦尼斯巴尔干拉塔尼亚</td>
              </tr>
              <tr>
                <td>斯坦尼斯醇正维吉尼亚</td>
              </tr>
              <tr>
                <td>斯坦尼斯顺滑香草</td>
              </tr>
              <tr>
                <td>斯坦尼斯野山樱桃</td>
              </tr>
              <tr>
                <td>斯坦尼斯菁纯黑树莓</td>
              </tr>
              <tr>
                <td>斯坦尼斯伦敦经典</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
      maskClosable: true,
      onOk() {},
    });
  }

  function onCheckboxChange(e) {
    setAcceptInsurance(e.target.checked)
  }

  let extraCharges = [];
  if (foundInsurance != null && acceptInsurance) {
    extraCharges.push({
      code: 'dutyTaxInsurance',
      name: '税险包',
      value: foundInsurance.sxb
    })
  }

  let {allowOrder, totalWeight, ...cartCalculationResult} = cartCalculation(cartItems, deliveryFee, extraCharges);

  const cartTableFooter = () => {
    const handleDeleteItems = () => {
        removeItemFromCart(cartItems,selectedRowKeys);
        setSelectedRowKeys([]);
        showMessage({type:'success',message:"删除成功"})
    }

    let deleteButton = (<Button onClick={handleDeleteItems} size="small" disabled={true}>删除已选</Button>);
    if (selectedRowKeys.length > 0) {
        deleteButton = (
            <Popconfirm
                title="确定删除已选?"
                onConfirm={handleDeleteItems}
                onCancel={()=>{}}
                okText="确定"
                cancelText="取消"
            >
                <Button type="danger" size="small">删除已选</Button>
            </Popconfirm>
        )
    }

    console.log('itemsss', cartItems)
    return (
        <React.Fragment>
            <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between"}}>
                {deleteButton}
                <Descriptions
                    bordered={true}
                    size="small"
                    column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}
                    style={{maxWidth:"100%"}}
                >
                    <Descriptions.Item label="小计">{cartCalculationResult.subTotal}</Descriptions.Item>
                    {/* {
                      cartCalculationResult.charges.map((aCharge, index)=>{
                        return (<Descriptions.Item key={index} label={(<span>{aCharge.name} <InfoCircleOutlined onClick={deliveryFeeInfo} /></span>)}>{aCharge.value}</Descriptions.Item>)
                      })
                    } */}
                    <Descriptions.Item label={(<span style={!allowOrder?{color:'red'}:{}}>邮费 ({(totalWeight/1000)}kg) <InfoCircleOutlined onClick={deliveryFeeInfo} /></span>)}>{cartCalculationResult.deliveryFee}</Descriptions.Item>
                    {/* <Descriptions.Item label={(<span>税险包 <InfoCircleOutlined onClick={insuranceInfo} /></span>)}>
                      {
                        foundInsurance != null ? (
                          <Checkbox checked={acceptInsurance} onChange={onCheckboxChange}>{foundInsurance.sxb}</Checkbox>
                        ) : '-'
                      }
                    </Descriptions.Item> */}
                    <Descriptions.Item label={`总计 (${configCache.currencyUnit})`}>{cartCalculationResult.total}</Descriptions.Item>
                </Descriptions>
            </div>
        </React.Fragment>
    )
  }

  let submitDisabled = cartItems.length > 0 && !loadingCreateOrder && allowOrder ? false : true;

  const onSubmit = (values) => {
    console.log('onSubmit', values)
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

  //let formInitialValues = customerCache ? customerCache : {}


  return (
    <Drawer
      title="购物车"
      placement="right"
      closable={true}
      onClose={closeDrawer}
      visible={drawerVisible}
      bodyStyle={{padding: 0}}
      width={'100%'}
      drawerStyle={{maxWidth:'100%'}}
    >
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
                onFinish={onSubmit}
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
                <Form.Item name={'remark'} label={
                  foundInsurance.free && foundInsurance.free > 0 ? (
                    <span>备注 【符合活动条件 (可获得赠品数量: {foundInsurance.free}包): <Button type='link' onClick={freeGiftInfo}>点击查看赠品选项</Button>】</span>
                  ) : "备注"
                } rules={foundInsurance.free && foundInsurance.free > 0 ? [{ required: true, message:"请输入赠品口味及数量" }] : []}>
                  <Input.TextArea
                    placeholder={'可填写赠品口味'}
                    defaultValue={""}
                    rows={4}
                  />
                </Form.Item>
                <Form.Item style={{textAlign:'right'}}>
                  <Button onClick={()=>{form.resetFields()}} style={{marginRight:'10px'}}>重置</Button>
                  <Button type="primary" onClick={()=>{form.submit()}} disabled={submitDisabled}>下单</Button>
                </Form.Item>
              </Form>
            </Panel>
          </Collapse>

        ) : null
      }

      <OrderInfo
        order={selectedOrder}
        visible={orderModalDisplay}
        closeModal={handleOrderModalDisplayClose}
      />
      {
        loadingCreateOrder ? <Loading/> : null
      }
    </Drawer>
  )
}

export default CartDrawer;
