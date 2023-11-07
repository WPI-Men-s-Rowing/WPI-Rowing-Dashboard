interface NavItemProps {
  children: React.ReactNode;
  route: string;
  active?: boolean;
}

function NavItem(props: NavItemProps) {
  return (
    <>
      <a
        href={props.route}
        className={`text-xl ${props.active ? "underline" : ""}`}
      >
        {props.children}
      </a>
    </>
  );
}

export default NavItem;
