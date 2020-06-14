import React, {useState} from 'react';
import { useConfigCache, configId, stockLocation } from '../../utils/Constants';
import { List, Typography, Divider } from 'antd';
import { Table, Tag, Space } from 'antd';

const Main = (props) => {
  const configCache = useConfigCache();
  const data = [
  'A. 买满任意5包草赠送皇室1包（口味可选）该独立订单另享赠品黑马8mm过滤嘴1袋+黑马110精致手卷册1册，税险包15。',
  'B. 买满任意10包草赠皇室2包，口味可选，税险包30.',
  'C. 买满任意15包草赠送皇室3包，口味可选，税险包55.',
  'D. 买满任意20包草赠送皇室4包，口味可选，税险包70.',
  'E. 买满任意25包草赠送皇室5包，口味可选，税险包90.',
];

const des1 = [
'（1）邮费：一公斤以内邮费80人民币，一到二公斤邮费96人民币，单个包裹重量不得超过2公斤.',
'（2）下单后48小时内出国际快递单号，鉴于目前疫情还未平息，本地国际物流每周五清单运输。',
'（3）整个物流时间为10-14个工作日。'
];

const des2 = [
  '（1）为了让大家顺利拿到货物，马男推出税险包服务，对于选择了税险包服务的客户，马男包全程清关流程和税费，对于未选择税险包的客户，如果该订单中税，马男依旧会对该订单的清关流程进行协助，但该订单产生的税金需客户自行承担。',
  '（2）关于税险包服务：所有类型的税险包服务客户均可自愿选择是否参保。',
  '（3）关于是否参保，马男在此也为小伙伴们整理出了税单Tips，供大家参考。'
]


const dataSource = [
  {
    key: '1',
    package: 'A 6包',
    tax: 60,
    fee: 15,
  },
  {
    key: '2',
    package: 'B 12包',
    tax: 120,
    fee: 30,
  },
  {
    key: '3',
    package: 'C 18包',
    tax: 180,
    fee: 55,
  },
  {
    key: '4',
    package: 'D 24包',
    tax: 240,
    fee: 70,
  },
  {
    key: '5',
    package: 'E 30包',
    tax: 300,
    fee: 90,
  },
];

const columns = [
  {
    title: '套餐',
    dataIndex: 'package',
    key: 'package',
  },
  {
    title: '未参保预计缴纳税费',
    dataIndex: 'tax',
    key: 'tax',
  },
  {
    title: '税险包价格',
    dataIndex: 'fee',
    key: 'fee',
  },
];

  return (
    <div>
      <div>
        <ul style = {{listStyle: 'none'}}>
          <li>年中回馈-海淘来袭</li>
          <li>皇室尊享主题季</li>
          <li><p>马男放水，补贴领到手软。为了回馈广大老客户，解决缺货问题，我们扬起了海淘的大帆，马男为了让大家都能顺利上船，对邮费和税费进行了大力补贴。</p></li>

        </ul>
      </div>

      <div>
        <>
          <Divider orientation="left">具体活动如下</Divider>
          <List
            size="small"
            header={<div>可选套餐</div>}
            footer={<div>Share & Enjoy</div>}
            bordered

            dataSource={data}
            renderItem={item => <List.Item>{item}</List.Item>}
          />
        </>

        <>
          <Divider orientation="left">海淘小贴士</Divider>
          <List
            size="small"
            header={<div>一. 关于运输和邮费</div>}
            dataSource={des1}
            renderItem={item => <List.Item>{item}</List.Item>}
          />
          <List
            size="small"
            header={<div>二. 关于税险包</div>}
            dataSource={des2}
            renderItem={item => <List.Item>{item}</List.Item>}
          />
        </>

        </div>

        <div>
          <Divider orientation="left">海关税费</Divider>
          <Table dataSource={dataSource} columns={columns}/>
        </div>

    </div>
  );
}

export default Main
