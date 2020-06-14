import React from 'react';
import { Route, Switch } from 'react-router-dom';
import gql from "graphql-tag";

import * as Components from './component/index'; 
import { useConfigQuery } from './utils/Constants';
import Loading from './utils/component/Loading';
import logo from './logo.svg';
import './css/index.css';

const App = () => {
  const configCache = useConfigQuery();

  const NotFound = () => {
    return (
      <div>
        404 Not Found
      </div>
    )
  }

  // if (loading) return 'Loading...';
  // if (error) return `Error! ${error.message}`;

  if (!configCache) console.log('error');

  let Layout = Components['Layout_01'];
  let Header = Components['Header_01'];
  let Footer = Components['Footer_01'];

  if (configCache) {
    return (
      <Layout
        header={<Header/>}
        footer={<Footer/>}
      >
        <div className="App">
            <Switch>
              <Route component={Components['Main']} exact={true} path={'/'}/>
              <Route component={Components['Products']} exact={true} path={'/products'}/>
              <Route component={Components['Products']} exact={true} path={'/category/:_id'}/>
              <Route component={Components['Orders']} exact={true} path={'/searchorder'}/> 
              <Route component={NotFound} />
            </Switch>
        </div>
      </Layout>
    );
  }
  else {
    return <Loading/>
  }
}

export default App;
