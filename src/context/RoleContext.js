"use client";

import { createContext, useContext, useState } from "react";

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [roleUpdated, setRoleUpdated] = useState(false);

  return (
    <RoleContext.Provider value={{ roleUpdated, setRoleUpdated }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
