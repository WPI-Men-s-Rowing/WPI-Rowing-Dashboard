import { FaUserAstronaut } from "react-icons/fa";
import useNkAuth from "../../nk-auth/useNkAuth.ts";
import NavItem from "./navItem.tsx";

function Navbar() {
  const nkAuth = useNkAuth();

  return (
    <>
      <div className="flex flex-row items-center justify-between bg-blue-400 px-5 py-3">
        <div className="text-xl">
          WPI Men<span>&#39;</span>s Rowing Dashboard
        </div>
        <div className="flex flex-row items-center gap-6">
          <NavItem route={"/"} active>
            On Water
          </NavItem>
          <NavItem route={"/"}>Erg Times</NavItem>
          <button
            onClick={() => {
              // Handle the NK login request
              nkAuth.handleNkLogin({
                redirectLocation: location.pathname,
                firstName: "Ian",
                lastName: "Wright",
              });
            }}
          >
            <FaUserAstronaut size={25} />
          </button>
        </div>
      </div>
    </>
  );
}

export default Navbar;
