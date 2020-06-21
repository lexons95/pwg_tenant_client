import React from 'react';
// import {  } from 'antd';
import { useConfigCache } from '../../utils/customHook';

const Footer_01 = (props) => {
  const configCache = useConfigCache();
  let year = new Date().getFullYear();
  return (
    <div id="footer_01">
      {configCache ? configCache.profile.name : ""} {year}
    </div>
  )
}

export default Footer_01;