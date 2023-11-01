import { INkAuthContext, NkAuthContext } from "./NkAuthContext.ts";
import { useContext } from "react";

// useNkAuth should simply return the NkAuthContext object containing
// the local nkAuth
const useNkAuth = () => useContext<INkAuthContext>(NkAuthContext);

export default useNkAuth;
