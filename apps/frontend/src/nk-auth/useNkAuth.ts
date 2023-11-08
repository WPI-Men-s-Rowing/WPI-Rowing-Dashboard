import { useContext } from "react";
import { INkAuthContext, NkAuthContext } from "./NkAuthContext.ts";

// useNkAuth should simply return the NkAuthContext object containing
// the local nkAuth
const useNkAuth = () => useContext<INkAuthContext>(NkAuthContext);

export default useNkAuth;
