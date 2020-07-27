import React, {useState} from 'react';
import { useConfigCache } from '../../utils/customHook';

import { Typography } from 'antd';

const { Paragraph } = Typography;

const Main = (props) => {
  const configCache = useConfigCache();
  
  let logoLink = null;
  if (configCache && configCache.profile.logo) {
    logoLink = configCache.imageSrc+configCache.profile.logo;
  }
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <Paragraph>
          设备不分高低贵贱，适合自己的就是最好的<br/>
          油一定要选择正规的，因为身体是自己的<br/>
          买什么产品不重要，重要的是卖你产品的人要懂这个产品<br/>
          待人为善，处处随缘。<br/>
      </Paragraph>
      {
        logoLink != null ? <img src={logoLink} style={{maxHeight: '80vh', maxWidth: '100%'}} /> : null
      }
    </div>
  )

}

export default Main
