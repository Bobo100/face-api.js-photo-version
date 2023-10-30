// components/HumanComponent.js
import { useEffect, useState, useRef } from 'react';
import styles from './humanComponent.module.scss'
import type { Config } from '@vladmandic/human';
// import * as tf from '@tensorflow/tfjs';

// import type * as tfjs from '@vladmandic/human/dist/tfjs.esm';
// import Human from '@vladmandic/human';


const HumanComponent = () => {

    // const human = new Human();
    // const tf = human.tf as typeof tfjs;

    const humanConfig: Partial<Config> = {
        debug: true,
        modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models',
        backend: 'webgl',
        filter: { enabled: true, equalization: false, flip: false },
        face: {
            enabled: true,
            detector: { rotation: false, maxDetected: 100, minConfidence: 0.2, return: true },
            iris: { enabled: true },
            description: { enabled: true },
            emotion: { enabled: true },
            antispoof: { enabled: true },
            liveness: { enabled: true },
        },
        body: { enabled: false },
        hand: { enabled: false },
        object: { enabled: false },
        gesture: { enabled: false },
        segmentation: { enabled: false },
    };

    const [humanInstance, setHumanInstance] = useState(null);
    const [ready, setReady] = useState(false);
    const imagesRef = useRef(null);
    const canvasRef = useRef(null);

    async function importHuman() {
        const { Human } = await import('@vladmandic/human');
        const instance = new Human(humanConfig);
        setHumanInstance(instance);
        setReady(true);
    }

    useEffect(() => {
        importHuman();
    }, [])

    // // 這部分替代了原本的window.onload
    // async function initTensorFlow() {
    //     // await tf.setBackend('webgpu');
    //     await tf.ready();
    // }

    // async function loadHuman() {
    //     const { Human } = await import('./human.esm.js');
    //     const instance = new Human(humanConfig);  // 這裡你可以使用你的`humanConfig`                
    //     setHumanInstance(instance);
    //     setReady(true);
    // }


    // // 然後在你的主功能或組件的`useEffect`中調用此函數：
    // useEffect(() => {
    //     initTensorFlow().then(() => {
    //         // 這裡進行其他TensorFlow.js操作
    //         console.log('TensorFlow.js is ready!')
    //         loadHuman();
    //     });
    // }, [])


    // 其他函數保持不變，但可能需要輕微的修改，例如對DOM的參考應使用useRef而不是直接訪問。

    async function detectFaces() {
        if (!imagesRef.current || !canvasRef.current) return;

        // Set canvas dimensions to match image dimensions
        canvasRef.current.width = imagesRef.current.width;
        canvasRef.current.height = imagesRef.current.height;

        // canvasRef.current要先清空
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        humanInstance.detect(imagesRef.current).then((result) => {
            console.log("detectFaces")
            humanInstance.draw.all(canvasRef.current, result)
            console.log(result)
        });
    }

    if (!ready) {
        return <div>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    imagesRef.current.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }} />
            <div className={styles.imageContainer}>
                <img
                    ref={imagesRef}
                    alt="test"
                    onLoad={() => detectFaces()}
                />
                <canvas
                    className={styles.canvas}
                    ref={canvasRef} />
            </div>
        </div>
    );
};

export default HumanComponent;
