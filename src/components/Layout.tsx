import Header from "./Header";
import Footer from "./Footer";
import BackgroundDecor from "./BackgroundDecor";
import FloatingCTA from "./FloatingCTA";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex min-h-screen flex-col">
      <BackgroundDecor />
      <Header />
      <main className="relative z-10 flex-1 pt-16 md:pt-20">{children}</main>
      <Footer />
      <FloatingCTA />
    </div>
  );
};

export default Layout;
