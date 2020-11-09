import React, {useState} from 'react';
import { useConfigCache } from '../../utils/customHook';

import { Typography, Divider } from 'antd';

const { Paragraph } = Typography;

const Main = (props) => {
  const configCache = useConfigCache();
  
  let logoLink = null;
  if (configCache && configCache.profile.logo) {
    logoLink = configCache.imageSrc+configCache.profile.logo;
  }
  return (
    <div className="main-container">
      <div className="main-shop-info">
        {
          logoLink != null ? <img src={logoLink} style={{maxHeight: '80vh', maxWidth: '100%'}} /> : null
        }
        <Paragraph>
            设备不分高低贵贱，适合自己的就是最好的<br/>
            油一定要选择正规的，因为身体是自己的<br/>
            买什么产品不重要，重要的是卖你产品的人要懂这个产品<br/>
            待人为善，处处随缘。<br/>
        </Paragraph>
      </div>
      <Divider/>
      <div className="main-event-info">
        <ul>
          <li>2020年的最后一次预定 80V,  21区，62区系列</li>
          <li>拼速度福利1：前1-20位 拍下付款后满1600元的玩家，我们将直播这20位里面抽奖一位，送一夫定制机器一台！价值3XXX！（没满就不送哦！）</li>
          <li>拼速度福利2：前30位满777元的玩家，我将抽三位送三台主机（上雾化器的主机）（参加福利1的玩家还可以参加福利2哦！）</li>
          <li>全民福利3：购买80V系列油满14瓶的，都可以免费领取一台我的老朋友即将出炉的一款注油盐主机！（记住是80v，不是21区也不是62区！）</li>
          <li>注意事项，网站下单后付款后，不再修改订单，请大家选择自己喜欢的品类。</li>
          <li>最后感谢大家的支持， 祝你们天天开心，我这也是娱乐每一天！</li>
        </ul>
      </div>
    </div>
  )

}

export default Main
