// components/HumanComponent.js
import { useEffect, useState, useRef } from 'react';
import styles from './humanComponent.module.scss'
import type { Human, Config } from '@vladmandic/human';
import imageCropUtils from '../utils/imageCropUtils';

const leftEyeArray = ['leftEyeUpper0', 'leftEyeLower0'];
const rightEyeArray = ['rightEyeUpper0', 'rightEyeLower0'];

const lipsArray = [
    'lipsUpperOuter',
    'lipsUpperInner',
    'lipsUpperSemiInner',
    'lipsUpperSemiOuter',
    'lipsLowerOuter',
    'lipsLowerInner',
    'lipsLowerSemiInner',
    'lipsLowerSemiOuter',
];

const temp = [332.0, 514.0, 786.0, 1155.0]
const tempEyePoints = {
    left: [{
        x: 513,
        y: 761
    }],
    right: [{
        x: 724,
        y: 773
    }]
}

const LIMIT_FACE_AREA = 128 * 128;
const LIMIT_FACE_WIDTH = 200;
const HumanComponent = () => {
    const humanConfig: Partial<Config> = {
        debug: true,
        backend: 'webgl',
        // modelBasePath: '../models',
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
                // console.log("Human...", Human)
                const instance = new Human.default(humanConfig) as Human;
                // console.log('human version:', instance.version, '| tfjs version:', instance.tf.version['tfjs-core']);
                // console.log('platform:', instance.env.platform, '| agent:', instance.env.agent);
                // console.log('loading models...')
                // console.log("instance...", instance)
                await instance.load().then(() => { // preload all models
                    // console.log('backend', instance!.tf.getBackend(), '| available：', instance!.env.backends);
                    // console.log('loaded models:' + Object.values(instance!.models).filter((model) => model !== null).length);
                    // console.log('initializing...')
                    instance!.warmup().then(() => { // warmup function to initialize backend for future faster detection
                        // console.log('ready...')
                        setHuman(instance);
                        setReady(true);
                    });
                });
            });
        }
    }, []);

    const boundingBox = (points) => {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (let [x, y] of points) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        return { minX, minY, maxX, maxY };
    };

    const getAnnotationPoints = (faceData: any, annotationName: string) => {
        if (!faceData || !annotationName) return;
        const points = faceData.annotations[annotationName].map((point: any) => {
            return { x: point[0], y: point[1] };
        });
        return points;
    }

    const findLeftRightPoints = (points: any) => {
        // 初始化最左邊和最右邊的點的 x 和 y 坐標為第一個點的坐標
        let leftPoint = { x: points[0].x, y: points[0].y };
        let rightPoint = { x: points[0].x, y: points[0].y };

        // 遍歷每個點，找到最左邊和最右邊的點
        points.forEach((point) => {
            // 如果當前點的 x 坐標小於最左邊的點的 x 坐標，則更新最左邊的點
            if (point.x < leftPoint.x) {
                leftPoint.x = point.x;
                leftPoint.y = point.y;
            }
            // 如果當前點的 x 坐標大於最右邊的點的 x 坐標，則更新最右邊的點
            if (point.x > rightPoint.x) {
                rightPoint.x = point.x;
                rightPoint.y = point.y;
            }
        });

        // 返回最左邊和最右邊的點的 x 和 y 坐標
        return { leftPoint, rightPoint };
    }

    const findEyeCenter = (eyePoints: any) => {
        // 初始化眼睛中心點的 x 和 y 坐標為 0
        let centerX = 0;
        let centerY = 0;

        // 遍歷眼睛的所有點，將所有點的 x 和 y 坐標相加
        eyePoints.forEach((point: any) => {
            centerX += point.x;
            centerY += point.y;
        });

        // 然後分別除以點的個數，得到眼睛中心點的 x 和 y 坐標
        centerX /= eyePoints.length;
        centerY /= eyePoints.length;

        // 返回眼睛中心點的 x 和 y 坐標
        return { x: centerX, y: centerY };
    }


    async function detectFaces() {
        if (!imagesRef.current || !canvasRef.current || !ready) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        const detect = await human.detect(imagesRef.current);
        if (detect) {
            // console.log('detect')
            canvasRef.current.width = detect.width;
            canvasRef.current.height = detect.height;
            human.draw.all(canvasRef.current, detect)
            // console.log(detect)

            if (detect.face && detect.face.length === 1) {
                const face = detect.face[0];
                setPitch(radianToDegree(face.rotation.angle.pitch));
                setYaw(radianToDegree(face.rotation.angle.yaw));
                setRoll(radianToDegree(face.rotation.angle.roll));

                const box = face.box;
                const size = face.size;
                // box分別是x y width height
                const x = box[0];
                const y = box[1];
                const width = box[2];
                const height = box[3];
                // 然後畫一個紅色的框框在canvas上
                // ctx.strokeStyle = 'red';
                // ctx.lineWidth = 5;
                // ctx.strokeRect(x, y, width, height);

                // console.log('face', face)
                // 這邊要再畫一些東需 face.annotaitons 的 lipsUpperOuter, lipsUpperInner, lipsUpperSemiInner, lipsUpperSemiOuter
                const drawArray = [
                    'lipsUpperOuter', 'lipsUpperInner', 'lipsUpperSemiInner', 'lipsUpperSemiOuter',
                    'lipsLowerOuter', 'lipsLowerInner', 'lipsLowerSemiInner', 'lipsLowerSemiOuter',
                    'noseTip', 'noseBottom', 'noseLeftCorner', 'noseRightCorner',
                ];
                const colorArray = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'black', 'white', 'gray', 'cyan', 'magenta', 'lime', 'teal', 'indigo', 'maroon', 'navy', 'olive', 'silver'];
                // drawArray.forEach((key) => {
                //     ctx.beginPath();
                //     // 寬度設定為1
                //     ctx.lineWidth = 1;
                //     ctx.strokeStyle = colorArray[drawArray.indexOf(key)];
                //     console.log('key', key, face.annotations[key])
                //     if (key === 'noseTip' || key === 'noseBottom' || key === 'noseLeftCorner' || key === 'noseRightCorner') {
                //         // 因為只會有一個點，所以直接畫一個點
                //         ctx.arc(face.annotations[key][0][0], face.annotations[key][0][1], 2, 0, 2 * Math.PI);
                //         // fill的顏色用紅色
                //         ctx.fillStyle = 'red';
                //         ctx.fill();
                //     } else {
                //         face.annotations[key].forEach((point, index) => {
                //             if (index === 0) {
                //                 ctx.moveTo(point[0], point[1]);
                //             } else {
                //                 ctx.lineTo(point[0], point[1]);
                //             }
                //         });
                //         ctx.closePath();
                //         ctx.stroke();
                //     }
                // });

                const lipsArray = [
                    'lipsUpperOuter', 'lipsUpperInner', 'lipsUpperSemiInner', 'lipsUpperSemiOuter',
                    'lipsLowerOuter', 'lipsLowerInner', 'lipsLowerSemiInner', 'lipsLowerSemiOuter',
                ];
                // 返回的會是array我們要直接拆出來 只要一個array
                // const lipsPoints = lipsArray.map((key) => {
                //     return getAnnotationPoints(face, key);
                // });
                const lipsPoints = lipsArray.map((key) => {
                    return getAnnotationPoints(face, key);
                });
                // flatten
                const lipsPointsFlat = lipsPoints.flat();

                // console.log('lipsPointsFlat', lipsPointsFlat)
                const { leftPoint: leftLipsPoint, rightPoint: rightLipsPoint } = findLeftRightPoints(lipsPointsFlat);
                // console.log('leftLipsPoint', leftLipsPoint, 'rightLipsPoint', rightLipsPoint)
                ctx.beginPath();
                ctx.arc(leftLipsPoint.x, leftLipsPoint.y, 2, 0, 2 * Math.PI);
                ctx.arc(rightLipsPoint.x, rightLipsPoint.y, 2, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();




                // 找眼睛
                const leftEyePoints = leftEyeArray
                    .map((key) => {
                        return imageCropUtils.getAnnotationPoints(face, key);
                    })
                    .flat();

                const rightEyePoints = rightEyeArray
                    .map((key) => {
                        return imageCropUtils.getAnnotationPoints(face, key);
                    })
                    .flat();

                // const eyePoints = {
                //     left: leftEyePoints,
                //     right: rightEyePoints,
                // };


                const eyePoints = tempEyePoints;
                // console.log('eyePoints', eyePoints)

                // 把eyePoints的點畫出來
                eyePoints.left.forEach((point) => {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                    ctx.fillStyle = 'red';
                    ctx.fill();
                });
                eyePoints.right.forEach((point) => {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                    ctx.fillStyle = 'red';
                    ctx.fill();
                });

                // // findEyeCenter
                // const leftEyeCenter = findEyeCenter(eyePoints.left);
                // const rightEyeCenter = findEyeCenter(eyePoints.right);
                // console.log('leftEyeCenter', leftEyeCenter, 'rightEyeCenter', rightEyeCenter)

                // // 畫出眼睛中心點
                // ctx.beginPath();
                // ctx.arc(leftEyeCenter.x, leftEyeCenter.y, 2, 0, 2 * Math.PI);
                // ctx.fillStyle = 'red';
                // ctx.fill();

                // ctx.beginPath();
                // ctx.arc(rightEyeCenter.x, rightEyeCenter.y, 2, 0, 2 * Math.PI);
                // ctx.fillStyle = 'red';
                // ctx.fill();



                const faceMesh = face.mesh.map((item) => {
                    return [item[0], item[1]];
                });
                const { minX, minY, maxX, maxY } = boundingBox(faceMesh);

                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'white';
                ctx.moveTo(minX, minY);
                ctx.lineTo(maxX, minY);
                ctx.lineTo(maxX, maxY);
                ctx.lineTo(minX, maxY);
                ctx.lineTo(minX, minY);
                ctx.stroke();
                ctx.font = '30px Arial';
                ctx.fillStyle = 'white';
                ctx.fillText('BoundingBox', minX, minY);


                const {
                    scale,
                    cropRect,
                    smartCropBbox,
                    smartCropBboxError,
                    originalImage,
                    avgEyePoints,
                    eyeCenter
                } = imageCropUtils.cropFaceForMakeup(imagesRef.current, eyePoints,
                    // [
                    // minX,
                    // minY,
                    // maxX,
                    // maxY,
                    // ]
                    temp
                );
                console.log('scale', scale, 'cropRect', cropRect, 'smartCropBbox', smartCropBbox, 'smartCropBboxError', smartCropBboxError, 'originalImage', originalImage, 'avgEyePoints', avgEyePoints)

                // smartCropBbox畫出來
                const { cropLeft, cropTop, cropRight, cropBottom } = smartCropBbox;
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'red';
                ctx.moveTo(cropLeft, cropTop);
                ctx.lineTo(cropRight, cropTop);
                ctx.lineTo(cropRight, cropBottom);
                ctx.lineTo(cropLeft, cropBottom);
                ctx.lineTo(cropLeft, cropTop);
                ctx.stroke();
                ctx.font = '30px Arial';
                ctx.fillStyle = 'red';
                ctx.fillText('smartCropBbox', cropLeft, cropTop);

                // 同時把smartCropBox的範圍 裁剪下來 下載
                // const cropCanvas = document.createElement('canvas');
                // cropCanvas.width = cropRight - cropLeft;
                // cropCanvas.height = cropBottom - cropTop;
                // const cropCtx = cropCanvas.getContext('2d');
                // cropCtx.drawImage(imagesRef.current, cropLeft, cropTop, cropRight - cropLeft, cropBottom - cropTop, 0, 0, cropRight - cropLeft, cropBottom - cropTop);
                // const cropImage = cropCanvas.toDataURL('image/png');
                // const a = document.createElement('a');
                // a.href = cropImage;
                // a.download = 'cropImage.png';
                // a.click();


                const { cropLeft: cropLeftRect, cropTop: cropTopRect, cropRight: cropRightRect, cropBottom: cropBottomRect } = cropRect;
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'blue';
                ctx.moveTo(cropLeftRect, cropTopRect);
                ctx.lineTo(cropRightRect, cropTopRect);
                ctx.lineTo(cropRightRect, cropBottomRect);
                ctx.lineTo(cropLeftRect, cropBottomRect);
                ctx.lineTo(cropLeftRect, cropTopRect);
                ctx.stroke();
                console.log('x, y, width, height', x, y, width, height)
                ctx.font = '30px Arial';
                ctx.fillStyle = 'blue';
                ctx.fillText('我們原本裁減的', cropLeftRect, cropTopRect);

                // eyeCenter.x eyeCenter.y
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'red';
                ctx.arc(eyeCenter.x, eyeCenter.y, 2, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();

                // avgEyePoints.left.x avgEyePoints.left.y
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'red';
                ctx.arc(avgEyePoints.left.x, avgEyePoints.left.y, 2, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();

                // avgEyePoints.right.x avgEyePoints.right.y
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'red';
                ctx.arc(avgEyePoints.right.x, avgEyePoints.right.y, 2, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();

                const rect = temp;
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'yellow';
                ctx.moveTo(rect[0], rect[1]);
                ctx.lineTo(rect[2], rect[1]);
                ctx.lineTo(rect[2], rect[3]);
                ctx.lineTo(rect[0], rect[3]);
                ctx.lineTo(rect[0], rect[1]);
                ctx.stroke();
                ctx.font = '30px Arial';
                ctx.fillStyle = 'yellow';
                ctx.fillText('BBox固定的', rect[0], rect[1]);

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
                <div onClick={() => {
                    const a = document.createElement('a');
                    a.href = canvasRef.current.toDataURL('image/png');
                    a.download = 'face.png';
                    a.click();
                }}>Download</div>
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
                {/* downloadCanvas */}
            </div>
        </div >
    );
};

export default HumanComponent;
