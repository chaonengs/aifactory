import React, { useState, createContext, useEffect } from 'react';

function getInitialState() {
    const userconfig = localStorage.getItem('aifactory')
    return userconfig ? JSON.parse(userconfig) : []
  }

export const UserContext = createContext(getInitialState());

export const UserProvider = props => {

    const [config, setConfig] = useState(getInitialState());

    useEffect(() => {
        localStorage.setItem('aifactory', JSON.stringify(config))
      }, config)
      
    return (
        <UserContext.Provider value={ [config, setConfig]}>
            {props.children}
        </UserContext.Provider>
    )

}