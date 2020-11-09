import React, {useRef} from 'react';
import { BackTop } from 'antd';
import { useConfigCache } from '../../utils/customHook';

const Layout_01 = (props) => {
  const layoutContentRef = useRef(null);
  const configCache = useConfigCache();
  return (
    <div id="layout_01">
      <div className="wrapper layout_01-wrapper">
        <div className="header">

          {props.header ? props.header : null}
        </div>
        {
          configCache && configCache.profile.notice ? (
            <div className="notice">
              <div className="notice-wrapper">
                <div className="slide-in-right">{configCache.profile.notice}</div>
              </div>
            </div>
          ) : null
        }
        <div className="content" ref={layoutContentRef}>
          {props.children ? props.children : null}
          <div className="footer">
            {props.footer ? props.footer : null}
          </div>
        </div>
      </div>
      <BackTop target={()=> layoutContentRef.current} style={{right:'15px',bottom:'15px'}}/>
    </div>
  )
}

export default Layout_01;