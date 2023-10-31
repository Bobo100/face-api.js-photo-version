import Link from "next/link"
import { useRouter } from "next/router"

const RouterLink = () => {
    const router = useRouter()
    return (
        <>
            <Link href="/" className={router.pathname === "/" ? "active" : ""}>Single Image</Link>
            <Link href="/multipleImage" className={router.pathname === "/multipleImage" ? "active" : ""}>Multiple Image</Link>
            <Link href="/test" className={router.pathname === "/test" ? "active" : ""}>Test</Link>
            <Link href="/human" className={router.pathname === "/human" ? "active" : ""}>Human</Link>
            <Link href="/human2" className={router.pathname === "/human2" ? "active" : ""}>Human2</Link>
        </>
    )
}

export default RouterLink