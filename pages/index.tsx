import Head from "next/head";
import Layout from '../components/layout';
import Home from "../components/home/home";


function HomePage() {
    return (
        <Layout>
            <Head>
                <title>Home</title>
            </Head>
            <Home />
        </Layout>
    )
}

export default HomePage