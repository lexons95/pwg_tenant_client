
import React, { useState, useEffect } from 'react';
import { Drawer, Button, Avatar, Table, Descriptions, Typography, Popconfirm, Collapse, Form, Input, Space } from 'antd';
import { MenuOutlined, ShoppingCartOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { useMutation } from "@apollo/react-hooks";
import gql from 'graphql-tag';

import { useConfigCache, useCartCache, setCartCache, cartCalculation, plusItemQty, minusItemQty, removeItemFromCart, useCustomerCache, setCustomerCache, defaultImage_system, configId } from '../../../utils/Constants';
import { showMessage } from '../../../utils/component/notification';
import Loading from '../../../utils/component/Loading';
import OrderInfo from './OrderInfo';

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
              style={{width:"125px"}}
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
    
    let cartCalculationResult = cartCalculation(cartItems, deliveryFee);
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
                    <Descriptions.Item label={"邮费"}>{cartCalculationResult.deliveryFee}</Descriptions.Item>
                    <Descriptions.Item label="总计">{cartCalculationResult.total}</Descriptions.Item>
                </Descriptions>
            </div>
        </React.Fragment>
    )
  }

  let submitDisabled = cartItems.length > 0 && !loadingCreateOrder ? false : true;
  
  const onSubmit = (values) => {
    console.log('onSubmit', values)
    const { remark, ...restValues } = values;
    let cartCalculationResult = cartCalculation(cartItems, deliveryFee);
    let finalItems = cartItems.map((anItem)=>{
      const { stock, ...restItem } = anItem;
      return restItem
    })
    let orderObj = {
      items: finalItems,
      total: cartCalculationResult.total,
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
                <Form.Item name={'remark'} label={'备注'}>
                  <Input.TextArea/>
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