import { Link, Navbar, NavbarContent, NavbarItem, Switch } from "@heroui/react";
import { useTheme } from "@heroui/use-theme";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router";

type NavBarRouteType = {
  name: string;
  href: string;
};

export default function NavBar() {
  const NavBarRoutes: NavBarRouteType[] = [
    {
      name: "Home",
      href: "/",
    },
    {
      name: "About",
      href: "/about",
    },
  ];
  const [activePath, setActivePath] = useState<string>("");

  useEffect(() => {
    const activePath = window.location.pathname;
    setActivePath(activePath);
  }, []);

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    console.log(theme);
  }, [theme]);

  return (
    <section className="flex h-dvh items-center justify-center flex-col">
      <Navbar
        height={36}
        isBlurred
        isBordered
        className="dark:bg-zinc-900/70 bg-zinc-100"
      >
        <p className="fixed cursor-default select-none left-1 font-coupri bg-linear-to-r from-danger to-secondary bg-clip-text hover:from-primary hover:to-success transition-colors duration-500 text-transparent">
          ugubhu
        </p>
        <NavbarContent
          justify="center"
          className="w-full flex items-center justify-center"
        >
          {NavBarRoutes.map((route) => (
            <NavbarItem key={route.name} isActive={activePath === route.href}>
              <Link
                className={`${
                  activePath === route.href
                    ? "text-secondary-500"
                    : "text-zinc-700"
                } font-coupri`}
                href={route.href}
              >
                {route.name}
              </Link>
            </NavbarItem>
          ))}
          <NavbarItem className="flex scale-90 fixed top-0 right-0 p-0.5">
            <Switch
              defaultSelected={theme === "dark"}
              color="secondary"
              endContent={<IconSun />}
              startContent={<IconMoon />}
              size="lg"
              onValueChange={() =>
                theme === "dark" ? setTheme("light") : setTheme("dark")
              }
            />
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <section className="flex grow items-center justify-center">
        <Outlet />
      </section>
    </section>
  );
}
