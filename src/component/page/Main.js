import React, {useState} from 'react';
import { configId, stockLocation } from '../../utils/Constants';
import { useConfigCache } from '../../utils/customHook';

import { List, Typography, Divider } from 'antd';
import { Table, Tag, Space } from 'antd';

const { Paragraph } = Typography;

const Main = (props) => {
  const configCache = useConfigCache();
  const data = [
  '本次活动赠送产品是皇室系列手卷草，每种口味限定10包，送完为止，如果下单时预留的口味没有货的话，客服会联系进行调换。',
  'A. 买满任意5包草赠送皇室1包（口味可选）该独立订单另享赠品黑马8mm过滤嘴1袋+黑马110精致手卷册1册，税险包15。',
  'B. 买满任意10包草赠皇室2包，口味可选，税险包30.',
  'C. 买满任意15包草赠送皇室3包，口味可选，税险包55.',
  'D. 买满任意20包草赠送皇室4包，口味可选，税险包70.',
  'E. 买满任意25包草赠送皇室5包，口味可选，税险包90.',
];

const des1 = [
'（1）邮费：一公斤以内邮费80人民币，一到二公斤邮费96人民币，单个包裹重量不得超过2公斤.',
'（2）下单后48小时内出国际快递单号，鉴于目前疫情还未平息，本地国际物流每周五清单运输。',
'（3）整个物流时间为10-15个工作日。'
];

const des2 = [
  '（1）为了让大家顺利拿到货物，马男推出税险包服务，对于选择了税险包服务的客户，马男包全程清关流程和税费，对于未选择税险包的客户，如果该订单中税，马男依旧会对该订单的清关流程进行协助，但该订单产生的税金需客户自行承担。',
  '（2）关于税险包服务：所有类型的税险包服务客户均可自愿选择是否参保。',
  '（3）关于是否参保，马男在此也为小伙伴们整理出了税单Tips，供大家参考。'
]





const dataSource = [
  {
    key: '1',
    package: 'A （5+1）包',
    tax: 60,
    fee: 15,
  },
  {
    key: '2',
    package: 'B （10+2）包',
    tax: 120,
    fee: 30,
  },
  {
    key: '3',
    package: 'C （15+3）包',
    tax: 180,
    fee: 55,
  },
  {
    key: '4',
    package: 'D （20+4）包',
    tax: 240,
    fee: 70,
  },
  {
    key: '5',
    package: 'E （25+5）包',
    tax: 300,
    fee: 90,
  },
];

const columns = [
  {
    title: '套餐',
    dataIndex: 'package',
    key: 'package',
    width: '130px'
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

  if (configId == 'mananml') {
    return (
      <div style ={{padding: '35px'}}>
        <div>
            <h1>年中回馈-海淘来袭</h1>
            <h2>皇室尊享主题季</h2>
            <div>马男放水，补贴领到手软。为了回馈广大老客户，解决缺货问题，我们扬起了海淘的大帆，马男为了让大家都能顺利上船，对邮费和税费进行了大力补贴。</div>
            <div>活动时间2020年6月15日-2020年6月30日</div>


        </div>

        <div style = {{textAlign: 'left', marginTop: '40px'}}>

            <Divider orientation="left">具体活动如下</Divider>
            <List
              size="small"
              header={<div style = {{fontWeight: 'bold'}}>可选套餐</div>}
              footer={<div style = {{textAlign: 'center'}}>Share & Enjoy</div>}
              bordered

              dataSource={data}
              renderItem={item => <List.Item>{item}</List.Item>}
            />


            <Divider orientation="left" style = {{marginTop: '40px'}}>海淘小贴士</Divider>
            <List
              size="small"
              header={<div style = {{fontWeight: '120px', textAlign:'left'}}>一. 关于运输和邮费</div>}
              dataSource={des1}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
            <List
              size="small"
              header={<div style = {{fontWeight: 'bold'}}>二. 关于税险包</div>}
              dataSource={des2}
              renderItem={item => <List.Item>{item}</List.Item>}
            />

          </div>

          <div style = {{marginTop: '40px'}}>
            <Divider orientation="left" >海关税费</Divider>
            <Table dataSource={dataSource} columns={columns} pagination = {false}/>
          </div>

      </div>
    );
  }
  else {
    let logoLink = null;
    if (configCache && configCache.profile.logo) {
      logoLink = configCache.imageSrc+configCache.profile.logo;
    }
    return (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        {
          logoLink != null ? <img src={logoLink} style={{maxHeight: '80vh'}} /> : null
        }
        <Paragraph>
            设备不分高低贵贱，适合自己的就是最好的<br/>
            油一定要选择正规的，因为身体是自己的<br/>
            买什么产品不重要，重要的是卖你产品的人要懂这个产品<br/>
            待人为善，处处随缘。<br/>
        </Paragraph>
      </div>
    )
  }
}

export default Main
