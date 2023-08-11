import Footer from "./Footer";
import NavBar from "./NavBar";

interface LayoutProps {
    children: React.ReactNode;
}
export default function Layout({ children }: LayoutProps) {
    return (<div>
        <NavBar />
        <div className="pt-20">
            {children}
        </div>
    </div>);
}