import Head from "next/head";
import Layout from '../components/layout';
import SingleImageComponent from "../components/singleImageComponent/singleImageComponent";

function HomePage() {
    return (
        <Layout>
            <Head>
                <title>singleImage</title>
            </Head>
            <SingleImageComponent />
        </Layout>
    )
}

export default HomePage