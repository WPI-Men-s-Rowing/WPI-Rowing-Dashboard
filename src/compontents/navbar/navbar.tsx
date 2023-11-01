import { FaUserAstronaut } from "react-icons/fa";
import NavItem from "./navItem.tsx";

function Navbar() {
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
          <NavItem route={"/"}>
            <FaUserAstronaut size={25} />
          </NavItem>
        </div>
      </div>
    </>
  );
}

export default Navbar;
