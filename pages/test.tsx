import Head from "next/head";
import Layout from '../components/layout';
import TestComponent from "../components/testComponent/testComponent";

function Test() {
    return (
        <Layout>
            <Head>
                <title>Test</title>
            </Head>
            <TestComponent />
        </Layout>
    )
}

export default Test