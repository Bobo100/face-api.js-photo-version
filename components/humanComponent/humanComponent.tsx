// components/HumanComponent.js
import { useEffect, useState, useRef } from 'react';
import styles from './humanComponent.module.scss'
import type { Human, Config } from '@vladmandic/human';
import * as tf from '@tensorflow/tfjs';
const HumanComponent = () => {
    const humanConfig: Partial<Config> = {
        debug: true,
        backend: 'webgl',
        modelBasePath: '../models',
        filter: { enabled: true, equalization: false, flip: false },
        face: {
            enabled: true,
            detector: { rotation: false, maxDetected: 2, minConfidence: 0.2, return: true },
            iris: { enabled: false },
            description: { enabled: false },
            emotion: { enabled: false },
            antispoof: { enabled: false },
            liveness: { enabled: false },
        },
        body: { enabled: false },
        hand: { enabled: false },
        object: { enabled: false },
        gesture: { enabled: false },
        segmentation: { enabled: false },
        async: true,
        cacheModels: true,
    };

    const [human, setHuman] = useState(null);
    const [ready, setReady] = useState(false);
    const [pitch, setPitch] = useState(0);
    const [yaw, setYaw] = useState(0);
    const [roll, setRoll] = useState(0);
    const imageContainerRef = useRef(null);
    const imagesRef = useRef(null);
    const canvasRef = useRef(null);


    useEffect(() => {
        importHuman();
        async function importHuman() {
            await import('@vladmandic/human').then(async (Human) => {
                const instance = new Human.default(humanConfig) as Human;
                // console.log('human version:', instance.version, '| tfjs version:', instance.tf.version['tfjs-core']);
                // console.log('platform:', instance.env.platform, '| agent:', instance.env.agent);
                // console.log('loading models...')
                // console.log(instance)
                // console.log('backend', instance!.tf.getBackend(), '| available：', instance!.env.backends);
                // console.log('loaded models:' + Object.values(instance!.models).filter((model) => model !== null).length);
                // console.log('initializing...')
                instance!.warmup().then(() => { // warmup function to initialize backend for future faster detection
                    // console.log('ready...')
                    setHuman(instance);
                    setReady(true);
                });
                // if (instance.state !== "backend") {
                //     console.log(instance.load())
                //     await instance.load().then(() => { // preload all models
                //         console.log('backend', instance!.tf.getBackend(), '| available：', instance!.env.backends);
                //         console.log('loaded models:' + Object.values(instance!.models).filter((model) => model !== null).length);
                //         console.log('initializing...')
                //         instance!.warmup().then(() => { // warmup function to initialize backend for future faster detection
                //             console.log('ready...')
                //             setHuman(instance);
                //             setReady(true);
                //         });
                //     });
                // }
            });
        }
    }, []);

    async function detectFaces() {
        if (!imagesRef.current || !canvasRef.current || !ready) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        const detect = await human.detect(imagesRef.current);
        if (detect) {
            console.log('detect')
            canvasRef.current.width = detect.width;
            canvasRef.current.height = detect.height;
            human.draw.all(canvasRef.current, detect)
            console.log(detect)

            if (detect.face && detect.face.length === 1) {
                const face = detect.face[0];
                setPitch(radianToDegree(face.rotation.angle.pitch));
                setYaw(radianToDegree(face.rotation.angle.yaw));
                setRoll(radianToDegree(face.rotation.angle.roll));
            }
        } else {
            console.log('no detect')
        }
    }

    const radianToDegree = (radian: number) => {
        return radian * 180 / Math.PI;
    }

    // pitch 不能超過10度
    // yaw 不能超過15度

    const isOverPitch = (degree: number) => {
        return Math.abs(degree) > 10;
    }

    const isOverYaw = (degree: number) => {
        return Math.abs(degree) > 15;
    }

    if (!ready) {
        return <div>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <div>
                <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        imagesRef.current.src = event.target.result;
                    };
                    if (file)
                        reader.readAsDataURL(file);
                }} />
                <div className={isOverPitch(pitch) ? styles.red : ''}>
                    {`Pitch: ${pitch}`}
                </div>
                <div className={isOverYaw(yaw) ? styles.red : ''}>
                    {`Yaw: ${yaw}`}
                </div>
                <div>
                    {`Roll: ${roll}`}
                </div>
            </div>
            <div className={styles.imageContainer}
                ref={imageContainerRef}
            >
                <img
                    ref={imagesRef}
                    alt="test"
                    onLoad={() => detectFaces()}
                />
                <canvas
                    className={styles.canvas}
                    ref={canvasRef} />
            </div>
        </div >
    );
};

export default HumanComponent;
