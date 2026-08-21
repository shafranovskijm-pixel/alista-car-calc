import { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import FloatingCTA from "./FloatingCTA";

const Layout = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const root = document.documentElement;
    const previousColorScheme = root.style.colorScheme;
    root.classList.add("public-site-active");
    root.style.colorScheme = "light";

    return () => {
      root.classList.remove("public-site-active");
      root.style.colorScheme = previousColorScheme;
    };
  }, []);

  return (
    <div className="public-site relative flex min-h-screen flex-col overflow-clip bg-background">
      <Header />
      <main className="relative flex-1 pt-16 md:pt-20">{children}</main>
      <Footer />
      <FloatingCTA />
    </div>
  );
};

export default Layout;
