import React from 'react';
import { Tag, Tooltip } from 'antd';
import { useConfigCache } from '../../../utils/customHook';

const ProductCard = (props) => {
  const { product, inventory = [], onClick } = props;
  const config = useConfigCache();

  const getProductImages = () => {
    let srcResult = config.defaultImage;
    if (product.images && product.images.length > 0) {
      let foundFavImage = product.images.find((anImage)=>anImage.fav);
      if (foundFavImage) {
        srcResult = config.imageSrc + foundFavImage.name;
      }
    }
    return {
      backgroundImage: `url(${srcResult})`
    }
  }

  const onCardClicked = () => {
    onClick()
  }

  const getTotalStock = () => {
    let total = 0;
    if (inventory.length > 0) {
      inventory.map((anInventory)=>{
        total += anInventory.stock
      })
    }
    return total;
  }

  let totalStock = getTotalStock();

  return (
    <div className="productCard-container" onClick={onCardClicked} style={{opacity: totalStock > 0 ? 1 : 0.6}}>
      <div className="productCard-media" style={getProductImages()}></div>
      <div className="productCard-info">
        
        <div className="productCard-status">
          <Tooltip title={product.name}>
            <div className="productCard-title">{product.name}</div>
          </Tooltip>
          {
            totalStock > 0 ? <span>库存: {getTotalStock()}</span> : "暂无"
          }
          
        </div>
      </div>
    </div>
  );
}

export default ProductCard;