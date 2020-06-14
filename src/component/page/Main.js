import React, {useState} from 'react';
import { useConfigCache, configId, stockLocation } from '../../utils/Constants';

const Main = (props) => {
  const configCache = useConfigCache();

  return (
    <div>
      {configCache && configCache.profile.logo? (
        <img src={configCache.imageSrc + configCache.profile.logo}/>
      ) : null}
    </div>
  );
}

export default Main