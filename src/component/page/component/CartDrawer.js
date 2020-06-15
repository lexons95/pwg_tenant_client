
import React, { useState, useEffect } from 'react';
import { Drawer, Button, Avatar, Table, Descriptions, Typography, Popconfirm, Collapse, Form, Input, Space, Checkbox, Modal } from 'antd';
import { MenuOutlined, ShoppingCartOutlined, PlusOutlined, MinusOutlined, InfoCircleOutlined} from '@ant-design/icons';
import { useMutation } from "@apollo/react-hooks";
import gql from 'graphql-tag';

import { useConfigCache, useCartCache, setCartCache, cartCalculation, plusItemQty, minusItemQty, removeItemFromCart, useCustomerCache, setCustomerCache, defaultImage_system, configId } from '../../../utils/Constants';
import { showMessage } from '../../../utils/component/notification';
import Loading from '../../../utils/component/Loading';
import OrderInfo from './OrderInfo';
import { useProductsQuery } from '../../../utils/customHook';

const { Paragraph, Text } = Typography;
const { Panel } = Collapse;

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

  const [ acceptInsurance, setAcceptInsurance ] = useState(false);

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


          // if (cartStockError.length > 0) {
          //   let foundItem = cartStockError.find((anErrorItem)=>anErrorItem.inventoryId == record.inventoryId);
          //   if (foundItem) {
          //     if (foundItem.stock - record.qty < 0) {
  
          //     }
          //     else {
  
          //     }
          //   }
          // }
 
          
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
    // {
    //     title: () => {
    //         return (<div>价格 ({configCache.currencyUnit})<sub><small>/个</small></sub></div>)
    //     },
    //     key: 'price',
    //     dataIndex: 'price'
    // },
    // {
    //   title: '数量',
    //   key: 'qty',
    //   dataIndex: 'qty',
    //   render: (text, record) => {
    //     const handlePlusQty = () => {
    //       let plusResult = plusItemQty(cartItems, record.inventoryId, 1);
    //       if (plusResult.success) {
    //         setCartItems(plusResult.data)
    //       }
    //     }
    //     const handleMinusQty = () => {
    //       let minusResult = minusItemQty(cartItems, record.inventoryId, 1);
    //       if (minusResult.success) {
    //         setCartItems(minusResult.data)
    //       }
    //     }
    //     return (
    //       <Input
    //         min={1}
    //         addonBefore={<MinusOutlined onClick={handleMinusQty} />}
    //         addonAfter={<PlusOutlined onClick={handlePlusQty} />}
    //         type="number"
    //         disabled={true}
    //         value={text}
    //       />
    //     )
    //   }
    // },
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
            <span>{`${configCache.currencyUnit} ${text}`}<sub>/个</sub></span>
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
    // A 5 草 free 1 皇室 SXB 15
    // B 10 草 free 2 皇室 SXB 30
    // C 15 草 free 3 皇室 SXB 55
    // D 20 草 free 4 皇室 SXB 70
    // E 25 草 free 5 皇室 SXB 90

    let conditions = [
      {
        property: 'qty',
        filter: {
          category: '草'
        },
        value: {
          name: 'A',
          free: 1,
          sxb: 15
        },
        min: 4,
        max: 9 
      },
      {
        property: 'qty',
        filter: 'category.草',
        value: {
          name: 'B',
          free: 2,
          sxb: 30
        },
        min: 9,
        max: 14
      },
      {
        property: 'qty',
        filter: 'category.草',
        value: {
          name: 'C',
          free: 3,
          sxb: 55
        },
        min: 14,
        max: 19 
      },
      {
        property: 'qty',
        filter: 'category.草',
        value: {
          name: 'D',
          free: 4,
          sxb: 70
        },
        min: 19,
        max: 24 
      },
      {
        property: 'qty',
        filter: 'category.草',
        value: {
          name: 'E',
          free: 5,
          sxb: 90
        },
        min: 24,
        max: 999 
      }
    ]
    
    let availableInsurance = conditions[0].value.sxb;
    let availableFreeGift = null;
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

        conditions.map((aCondition)=>{
          if (totalQty > aCondition.min && totalQty <= aCondition.max) {
            availableInsurance = aCondition.value.sxb;
            availableFreeGift = aCondition.value.free;
          }
        });


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
  // let deliveryInfo = () => {
  //     let tooltip = (
  //         <Tooltip title={Constants.deliveryFeeRules.conditions[0].description}>
  //             <Icon type="question-circle-o" />
  //         </Tooltip>
  //     )
  //     return (
  //         <div style={{display:"flex",alignItems:"center"}}>
  //             邮费&nbsp;{tooltip}
  //         </div>
  //     )
  // }
  
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
                <th>2kg</th>
              </tr>
              <tr>
                <th>重量 (kg)</th>
                <th>价格 (RMB)</th>
              </tr>
              <tr>
                <td>小于/等于 1</td>
                <td>80</td>
              </tr>
              <tr>
                <td>大于 1</td>
                <td>96</td>
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
              <tr>
                <th>套餐</th>
                <th>购买数量 (仅限手卷草)</th>
                <th>价格 (RMB)</th>
              </tr>
              <tr>
                <td>A</td>
                <td>满 5 包</td>
                <td>15</td>
              </tr>
              <tr>
                <td>B</td>
                <td>满 10 包</td>
                <td>30</td>
              </tr>
              <tr>
                <td>C</td>
                <td>满 15 包</td>
                <td>55</td>
              </tr>
              <tr>
                <td>D</td>
                <td>满 20 包</td>
                <td>70</td>
              </tr>
              <tr>
                <td>E</td>
                <td>满 25 包</td>
                <td>90</td>
              </tr>
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
                <th colspan="2">
                  本次活动赠送产品是皇室系列手卷草，每种口味限定10包，送完为止，如果下单时预留的口味没有货的话，客服会联系进行调换。
                </th>
              </tr>
              <tr>
                <th>代号</th>
                <th>口味</th>
              </tr>
              <tr>
                <td>H1</td>
                <td>皇室贵妃樱桃</td>
              </tr>
              <tr>
                <td>H2</td>
                <td>皇室酸甜蓝莓</td>
              </tr>
              <tr>
                <td>H3</td>
                <td>皇室甜心草莓</td>
              </tr>
              <tr>
                <td>H4</td>
                <td>皇室大菠萝</td>
              </tr>
              <tr>
                <td>H5</td>
                <td>皇室至尊原味</td>
              </tr>
              <tr>
                <td>H6</td>
                <td>皇室甄选香草</td>
              </tr>
              <tr>
                <td>H7</td>
                <td>皇室霹雳薄荷</td>
              </tr>
              <tr>
                <td>H8</td>
                <td>皇室诱香苹果</td>
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
                    <Descriptions.Item label={(<span>税险包 <InfoCircleOutlined onClick={insuranceInfo} /></span>)}>
                      {
                        foundInsurance != null ? (
                          <Checkbox checked={acceptInsurance} onChange={onCheckboxChange}>{foundInsurance.sxb}</Checkbox>
                        ) : '-'
                      }
                    </Descriptions.Item>
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