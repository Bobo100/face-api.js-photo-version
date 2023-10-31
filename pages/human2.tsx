import Head from "next/head";
import Layout from '../components/layout';
import HumanComponent2 from "../components/humanComponent2/humanComponent2";

function HumanPage() {
    return (
        <Layout>
            <Head>
                <title>HumanPage</title>
            </Head>
            <HumanComponent2 />
        </Layout>
    )
}

export default HumanPage