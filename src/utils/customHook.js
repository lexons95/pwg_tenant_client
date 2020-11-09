import { useQuery, useMutation, gql } from "@apollo/client";

import ApolloClientAPI from './ApolloClientAPI';
import { configId, stockLocation, defaultImage_system } from './Constants';

export const DefaultClientAPI = ApolloClientAPI();

DefaultClientAPI.client.writeData({
  data: {
    config: null,
    cart: null,
    customer: null
  }
})

const GET_USER_CONFIG_QUERY = gql`
  query userConfig($configId: String!) {
    userConfig(configId: $configId) {
        success
        message
        data
    }
  }
`

const GET_CONFIG_CACHE_QUERY = gql`
  query config {
    config {
      _id
      configId
      defaultImage_system
      defaultImage
      imageSrc
      paymentQRImage
      server
      profile
      currencyUnit
      delivery
    }
  }
`

const SET_CONFIG_CACHE_QUERY = gql`
  query config {
    config {
      _id
      configId
      defaultImage_system
      defaultImage
      imageSrc
      paymentQRImage
      server
      profile
      currencyUnit
      delivery
    }
  }
`

const handleConfigOuput = (config = null) => {
  let result = null;
  if (config) {
    result = {...config}
    let newDefaultImage = defaultImage_system;
    if (result.defaultImage && result.defaultImage != "") {
      newDefaultImage = result.imageSrc + result.defaultImage;
    }
    result['defaultImage'] = newDefaultImage;
  }
  return result;
}

export const getConfigCache = () => {
  const result = DefaultClientAPI.client.readQuery({
    query: GET_CONFIG_CACHE_QUERY,
    fetchPolicy: 'cache-only'
  });
  return result;
}

export const setConfigCache = (data) => {
  DefaultClientAPI.client.writeQuery({
    query: SET_CONFIG_CACHE_QUERY,
    data: {
      config: handleConfigOuput(data)
    }
  });
}

export const useConfigCache = () => {
  const { data, error, loading } = useQuery(GET_CONFIG_CACHE_QUERY,{
    fetchPolicy: 'cache-only'
  });

  let result = null;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('error useConfigCache',error);
  }
  if (data && data.config) {
    result = data.config;
  }
  return result;
}

export const useConfigQuery = (input) => {
  const { data, error, loading } = useQuery(GET_USER_CONFIG_QUERY,{
    fetchPolicy: 'cache-and-network',
    variables: {
      configId: input ? input : configId
    },
    onCompleted: (result) => {
      if (result && result.userConfig && result.userConfig.success) {
        let configResult = result.userConfig.data;
        setConfigCache(configResult);
        initialCache();
      }
    }
  });
  let result = null;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('useConfigQuery',error);
  }
  if (data && data.userConfig) {
    result = handleConfigOuput(data.userConfig.data);
  }
  return result;
}


export const useProductsState = (query, options={}) => {
  const queryResult = useQuery(query,options);
  return queryResult;
}



export const useCustomQuery = (query, options={}) => {
  const { data, error, loading } = useQuery(query,options);
  if (loading) {

  }
  if (error) {
    console.log('useCustomQuery error: ', error)
    return null;
  }

  return data;
}

export const useCustomMutation = (query, options={}) => {
  const [ runMutationFunc, { data, loading, error }] = useMutation(query,options);

  const handleMutationFunc = async (options2) => {
    try {
      const result = await runMutationFunc(options2);
      return result;
    } catch (error2) {
      console.log(error2.graphQLErrors)
    }
  };

  return {
    run: handleMutationFunc,
    data: data,
    loading: loading,
    error: error
  };
};

function setNestedObjectValue(parent, path, value, deepCopy = false) {
  let schema = parent;
  if (deepCopy) {
    schema = JSON.parse(JSON.stringify(parent));
  }

  let pathList = [];

  if (Array.isArray(path)) {
    pathList = path;
  }
  else {
    pathList = path.split('.');
  }
  let pathLength = pathList.length;

  for (let i = 0; i < pathLength-1; i++) {
      let elem = pathList[i];
      if( !schema[elem] ) schema[elem] = {}
      schema = schema[elem];
  }

  schema[pathList[pathLength-1]] = value;
  return schema
}

const addConfigIdVariable = (options) => {
  let result = {...options};

  // setNestedObjectValue(result, ['variables','filter','filter','published'], true);
  if (result.variables) {
    result['variables']['configId'] = configId;
    if (result['variables']['filter']) {
      if (result['variables']['filter']['filter']) {
        let whereObj = {
          ...result['variables']['filter']['filter'],
          published: true,
          type: stockLocation
        }
        result['variables']['filter']['filter'] = whereObj;
      }
      else {
        result['variables']['filter'] = {
          filter: {
            published: true,
            type: stockLocation
          }
        }
      }
    }
    else {
      result['variables']['filter'] = {
        filter: {
          published: true,
          type: stockLocation
        }
      }
    }
  }
  else {
    result['variables'] = { 
      filter: {
        filter: {
          published: true,
          type: stockLocation
        }
      },
      configId: configId 
    };
  }
  return result;
}

const GET_PRODUCTS_QUERY = gql`
  query products($filter: JSONObject, $configId: String!) {
    products(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      name
      description
      type
      category
      tags
      variants
      published
      images
    }
  }
`;

export const useProductsQuery = (options={}) => {
  let newOptions = addConfigIdVariable(options);
  const { data, error, loading } = useQuery(GET_PRODUCTS_QUERY,newOptions);
  if (loading) {
    return null;
  }
  if (error) {
    console.log('useProductsQuery error: ', error)
    return null;
  }

  return data.products;
}

const GET_INVENTORY_QUERY = gql`
  query inventory($filter: JSONObject, $configId: String) {
    inventory(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      price
      stock
      variants
      published
      productId
    }
  }
`;

export const useInventoryQuery = (options={}) => {
  let newOptions = addConfigIdVariable(options);
  const { data, error, loading } = useQuery(GET_INVENTORY_QUERY,newOptions);
  if (loading) {

  }
  if (error) {
    console.log('useInventoryQuery error: ', error)
    return null;
  }

  return data.inventory;
}



const initialCache = () => {
  let sessionCart = sessionStorage.getItem(configId+"-cart");
  if (sessionCart != null) {
    setCartCache(Object.assign({},JSON.parse(sessionCart)))
  }
  else {
    setCartCache(defaultCartObj)
  }

  let sessionCustomer = sessionStorage.getItem(configId+"-customer");
  if (sessionCustomer != null) {
    setCustomerCache(Object.assign({},JSON.parse(sessionCustomer)))
  }
  else {
    setCustomerCache(defaultCustomerObj)
  }
}

const GET_CART_CACHE = gql`
  query cart {
    cart @client {
      items
    }
  }
`;

const SET_CART_CACHE = gql`
  query cart {
    cart {
      items
    }
  }
`;

const defaultCartObj = {
  items: []
}
export const setCartCache = (data) => {
  DefaultClientAPI.client.writeQuery({
    query: SET_CART_CACHE,
    data: {
      cart: data
    }
  });

  sessionStorage.setItem(configId+"-cart", JSON.stringify(data));
}

export const useCartCache = () => {
  const { data, error, loading } = useQuery(GET_CART_CACHE,{
    fetchPolicy: 'cache-only'
  });

  let result = null;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('error useCartCache',error);
  }
  if (data && data.cart) {
    result = data.cart;
  }
  return result;
}



const GET_CUSTOMER_CACHE = gql`
  query customer {
    customer @client {
      name
      contact
      address
      postcode
      province
    }
  }
`;

const SET_CUSTOMER_CACHE = gql`
  query customer {
    customer {
      name
      contact
      address
      postcode
      province
    }
  }
`;

const defaultCustomerObj = {
  name: "",
  contact: "",
  address: "",
  postcode: "",
  province: ""
}

export const setCustomerCache = (data) => {
  DefaultClientAPI.client.writeQuery({
    query: SET_CUSTOMER_CACHE,
    data: {
      customer: data
    }
  });

  sessionStorage.setItem(configId+"-customer", JSON.stringify(data));
}

export const useCustomerCache = () => {
  const { data, error, loading } = useQuery(GET_CUSTOMER_CACHE,{
    fetchPolicy: 'cache-only'
  });

  let result = null;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('error useCartCache',error);
  }
  if (data && data.customer) {
    result = data.customer;
  }
  return result;
}

// custom hook starts with 'use'
// const useCustomHook = () => {
//   const [state, setState] = useState(null);
//   useEffect(() => {
//     const handleScroll = () => setScrollPosition(window.scrollY);
//     document.addEventListener('scroll', handleScroll);
//     return () =>
//       document.removeEventListener('scroll', handleScroll);
//   }, []);
// }

// export const setApolloCache = (key, query, data) => {
//   DefaultClientAPI.client.writeQuery({
//     query: query,
//     data: {
//       [key]: data
//     }
//   });
// }
