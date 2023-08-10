import { useRouter } from "next/router"
import RouterLink from "./RoutesLink"

const Footer = () => {
    const router = useRouter()
    return (
        <div className="footer">
            <RouterLink />
        </div>
    )
}

export default Footer