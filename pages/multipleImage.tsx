import Head from "next/head";
import Layout from '../components/layout';
import MultipleImageComponent from "../components/multipleImageComponent/multipleImageComponent";

function MultipleImage() {
    return (
        <Layout>
            <Head>
                <title>multipleImage</title>
            </Head>
            <MultipleImageComponent />
        </Layout>
    )
}

export default MultipleImage