import Head from "next/head";
import Layout from '../components/layout';
import HumanComponent from "../components/humanComponent/humanComponent";

function HumanPage() {
    return (
        <Layout>
            <Head>
                <title>HumanPage</title>
            </Head>
            <HumanComponent />
        </Layout>
    )
}

export default HumanPage