import React, {useEffect} from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useConfigCache, useUserCache } from '../../utils/customHook';

const PublicRoute = ({ component: Component, restricted, ...rest }) => {
  const defaultRoute = "/";
  const userResult = useUserCache();
  const configResult = useConfigCache();
  
  let loggedIn = false;
  if (userResult && userResult.success && configResult) {
    loggedIn = true;
  }

  return (
    // restricted = false meaning public route
    // restricted = true meaning restricted route
    <Route {...rest} render={props => (
      loggedIn && restricted ?
        <Redirect to={defaultRoute} />
        : <Component {...props} />
    )} />
  );
};

export default PublicRoute;