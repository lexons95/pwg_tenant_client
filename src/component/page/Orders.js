import React, {useState} from 'react';
import { Table, Button, Input, Form, Tag } from 'antd';
import { format } from 'date-fns';
import gql from "graphql-tag";
import { useLazyQuery } from "@apollo/react-hooks";

import OrderInfo from './component/OrderInfo';
import { configId } from '../../utils/Constants';
import Loading from '../../utils/component/Loading';

const { Search } = Input;
const crypto = require('crypto');

const GET_ORDERS_QUERY = gql`
  query orders($filter: JSONObject, $configId: String) {
    orders(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      items
      total
      charges
      customer
      remark
      paid
      sentOut
      trackingNum
      deliveryFee
    }
  }
`;

const CANCEL_ORDER_QUERY = gql`
  mutation cancelOrder($_id: String!) {
    cancelOrder(_id: $_id) {
      success
      message
      data
    }
  }
`;

const Orders = (props) => {

  const [ orderModalDisplay, setOrderModalDisplay ] = useState(false);
  const [ selectedOrder, setSelectedOrder ] = useState(null);
  const [ foundOrders, setFoundOrders ] = useState([]);

  const [ form ] = Form.useForm();
  const [ searchOrders, { loading: loadingSearchOrders} ] = useLazyQuery(GET_ORDERS_QUERY, {
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      console.log("products error", error)

    },
    onCompleted: (result) => {
      setFoundOrders(result && result.orders ? result.orders : [])
    }
  });


  const handleOrderModalDisplayOpen = (selectedOrder) => {
    setOrderModalDisplay(true);
    setSelectedOrder(selectedOrder)
  }
  const handleOrderModalDisplayClose = () => {
    setOrderModalDisplay(false);
  }

  const defaultColumns = [
    {
      title: "No.",
      dataIndex: 'index',
      key: 'index',
      width: 75,
      render: (text, record, index) => {
        return `${index + 1}.`;
      }
    },
    {
      title: "订购日期",
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (text, record) => {
        let dateTime = format(new Date(text), "MM/dd/yyyy hh:mm:ss aa")
        return dateTime;
      }
    },
    {
      title: "订单编号",
      dataIndex: '_id',
      key: '_id',
      render: (text, record) => {
        return (
          <a style={{whiteSpace:"pre-wrap", textDecoration:"underline"}} onClick={()=>{handleOrderModalDisplayOpen(record)}}>{record._id.toUpperCase()}</a>
        )
      }
    },
    {
      title: "收货人",
      dataIndex: 'customer',
      key: 'customer',
      sorter: (a, b) => a.name - b.name,
      render: (text, record) => {
        return text.name;
      }
    },
    {
      title: "总计",
      dataIndex: 'total',
      key: 'total',
      sorter: (a, b) => a.total - b.total
    },
    {
      title: "付款状态",
      dataIndex: 'paid',
      key: 'paid',
      render: (text, record) => {
        if (record.paid) {
          return (<Tag color="green">已付款</Tag>)
        }
        else {
          return (<Tag color="red">未付款</Tag>)

        }
      }
    },
    {
      title: "快递编号",
      dataIndex: 'trackingNum',
      key: 'trackingNum',
      width: 200,
      render: (text, record) => {
        let result = null;
        if (record.sentOut && text) {
          result = (
            <div>{text}</div>
          )
        }
        else {
          result = (<Tag color="red">未发货</Tag>)
        }
        return result;
      } 
    }
  ]

  
  const onFormSubmit = (values) => {
    searchOrders({
      variables:{
        filter: {
          filter: {
            'customer.contact': values.contact
          }
        },
        configId: configId
      }
    })
  }

  const colWidth = 100;

  const toMD5 = (data) => {
    let result = crypto.createHash('md5').update(data).digest("hex");
    return result;
  }

  const getKuaiDi100 = async (company="ems", trackingNum) => {
    const requestUrl = "https://poll.kuaidi100.com/poll/query.do";
    const customerToken = "810BB5350154EB04EE4F4D144FC07055";
    const key = "yWpRAPTu312";
    let param = {"com": company,"num": trackingNum}
    let stringifiedParam = JSON.stringify(param)
    // let sign = toMD5(stringifiedParam) + toMD5(key) + toMD5(customerToken);
    let sign = toMD5(stringifiedParam + key + customerToken);
    let finalSign = sign.toUpperCase();
    
    let requestObj = {"customer": customerToken, "sign": finalSign, "param": stringifiedParam}

    let stringifiedObj = JSON.stringify(requestObj)
    console.log('stringifiedObj',stringifiedObj)
    // Default options are marked with *
    const response = await fetch(requestUrl, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      // mode: 'cors', // no-cors, *cors, same-origin
      // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      // //credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        //'Content-Type': 'application/x-www-form-urlencoded',
        //'Access-Control-Allow-Origin': '*'
      },
      // //redirect: 'follow', // manual, *follow, error
      // referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: stringifiedObj // body data type must match "Content-Type" header
    });

    fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: stringifiedObj
    }).then((response)=>{

    });


    return response.json(); // parses JSON response into native JavaScript objects
    
  }

  return (
    <div style={{padding:'24px'}}>
    {/* <Button onClick={()=>{
      let company="js", trackingNum="JDVG00326558797";
      getKuaiDi100(company,trackingNum).then(data=>{
        console.log('getKuaiDi100 data',data)
      }).catch(err=>{
        console.log('getKuaiDi100 err',err)
      })
    }}>快递</Button> */}
      <Form
        form={form}
        onFinish={onFormSubmit}
        layout={'inline'}
        style={{
          marginBottom: '8px'
        }}
      >
        <Form.Item name={'contact'} rules={[{ required: true, message:"请输入电话号码" }]}>
          <Search
            placeholder="电话号码"
            enterButton
            onSearch={()=>form.submit()} 
            disabled={loadingSearchOrders}
          />
        </Form.Item>
      </Form>

      <Table
        rowKey={'_id'}
        columns={defaultColumns} 
        dataSource={foundOrders} 
        pagination={false}
        size="small"
        scroll={{x: defaultColumns.length * colWidth}}
        footer={null}
      />
      
      {
        orderModalDisplay ? (
          <OrderInfo
            order={selectedOrder}
            visible={orderModalDisplay}
            closeModal={handleOrderModalDisplayClose}
          />
        ) : null
      }
      {
        loadingSearchOrders ? <Loading/> : null
      }
        
    </div>
  )
}

export default Orders;