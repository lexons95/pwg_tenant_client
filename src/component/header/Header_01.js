import React, { useState, useEffect } from 'react';
import { Drawer, Button, Menu, PageHeader, Badge, Avatar, Breadcrumb } from 'antd';
import { MenuOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import {Helmet} from "react-helmet";
import { useHistory } from "react-router-dom";
import { useConfigCache, useCartCache, getAllProductCategory } from '../../utils/Constants';
import { useProductsQuery } from '../../utils/customHook';
import CartDrawer from '../page/component/CartDrawer';


const Header_01 = (props) => {
  const configCache= useConfigCache();
  const cartCache = useCartCache();
  const productsResult = useProductsQuery();

  const routerHistory = useHistory();
  const [ navDrawerVisible, setNavDrawerVisible ] = useState(false);
  const [ cartDrawerVisible, setCartDrawerVisible ] = useState(false);

  const [ productCategories, setProductCategories ] = useState([]);

  useEffect(()=>{
    if (productsResult != null && productsResult.length > 0) {
  // console.log('productsResult',productsResult)
  // productsResult.map((x)=>{
  //   console.log('product info', {
  //     id: x._id,
  //     name: x.name,
  //     category: x.category.length > 0 ? x.category[0]: []
  //   })
  // })
      let allCategories = getAllProductCategory(productsResult);
      setProductCategories(allCategories);
    }
  },[productsResult]);

  const handleNavDrawerOpen = () => {
    setNavDrawerVisible(true);
  }
  const handleNavDrawerClose = () => {
    setNavDrawerVisible(false);
  }

  const handleCartDrawerOpen = () => {
    setCartDrawerVisible(true);
  }
  const handleCartDrawerClose = () => {
    setCartDrawerVisible(false);
  }


  const getProductCategoryMenu = () => {
    let result = [];
    productCategories.map((aCategory)=>{
      let key = aCategory._id ? aCategory._id : (aCategory.key ? aCategory.key : null);
      let name = aCategory.name ? aCategory.name : (aCategory.label ? aCategory.label : null);
      if (key != null && name != null) {
        result.push({
          key: `/category/${key}`,
          name: name
        })
      }
    });
    return result;
  }

  const getMenuData = () => {
    let result = [
      {
        key: '/',
        name: '主页'
      },
      {
        key: '/products',
        name: '全部产品'
      }
    ];
    result = [...result, ...getProductCategoryMenu()]
    // result.push({
    //   key: '/searchorder',
    //   name: '搜索订单'
    // })
    return result;
  }

  let menuData = getMenuData();

  let title = "";
  let logoLink = "";
  if (configCache) {
    title = configCache.profile.name;
    if (configCache.profile.logo) {
      logoLink = configCache.imageSrc+configCache.profile.logo;
      title = (<><Avatar src={`${configCache.imageSrc+configCache.profile.logo}`}/> {title}</>)
    }
  }

  let totalQty = 0;
  if (cartCache) {
    cartCache.items.map((aCartItem)=>{
      totalQty += aCartItem.qty;
    })
  }

  title = (
    <>
      <Breadcrumb>
        <Breadcrumb.Item>{title}</Breadcrumb.Item>
        {
          routerHistory.location.state && routerHistory.location.state.name ? (
            <Breadcrumb.Item>{routerHistory.location.state.name}</Breadcrumb.Item>
          ) : null
        }
      </Breadcrumb>
    </>
  )

  return (
    <div>
      <Helmet>
        {
          configCache ? (
            <title>{configCache.profile.name}</title>
          ) : null
        }
      </Helmet>
      <PageHeader
        //className="site-page-header-responsive"
        onBack={handleNavDrawerOpen}
        backIcon={<MenuOutlined />}
        title={title}
        extra={[
          <div key="cart" style={{height: "100%", display: 'flex',alignItems:'center'}}>
            <Badge count={totalQty}>
              {/* <Button icon={<ShoppingCartOutlined/>} onClick={handleCartDrawerOpen} style={{border:'none'}} /> */}
                <ShoppingCartOutlined style={{fontSize:"22px", cursor: "pointer"}} className="ant-page-header-back-button" onClick={handleCartDrawerOpen}/>
            </Badge>
          </div>
        ]}
      />

      <Drawer
        title="目录"
        placement="left"
        closable={true}
        onClose={handleNavDrawerClose}
        visible={navDrawerVisible}
        bodyStyle={{padding: 0}}
      >
        <Menu onClick={({ item, key, ...restProps })=>{
          let foundData = menuData.find((aData)=>aData.key == key)
          routerHistory.push({
            pathname:key,
            state: foundData ? { name:foundData.name} : null
          });
          handleNavDrawerClose();
        }}>
        {
          menuData.map((aMenu)=>{
            return <Menu.Item key={aMenu.key}>{aMenu.name}</Menu.Item>
          })
        }
          <Menu.Divider/>
          <Menu.Item key={'/searchorder'}>搜索订单</Menu.Item>
        </Menu>
      </Drawer>

      <CartDrawer
        drawerVisible={cartDrawerVisible}
        closeDrawer={handleCartDrawerClose}
      />
    </div>
  )
}

export default Header_01;
