import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import styles from './home.module.scss';

function Home() {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const photoRef = useRef<HTMLImageElement>(null);
    const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
    const photoWidth = 960;
    const photoHeight = 720;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [faceArea, setFaceArea] = useState(0);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';

            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            ]);

            setModelsLoaded(true);
        };

        loadModels();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const img = await faceapi.bufferToImage(file);
        setPhoto(img);

        if (modelsLoaded && canvasRef.current && img.complete) {
            const canvas = canvasRef.current;
            const displaySize = { width: photoWidth, height: photoHeight };
            faceapi.matchDimensions(canvas, displaySize);

            const detections = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options())
                .withFaceLandmarks();
                
            console.log(detections);
            setFaceArea(detections.detection.box.area / (detections.detection.imageHeight * detections.detection.imageWidth) * 100);

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, photoWidth, photoHeight);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        }
    };

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleImageUpload} title='image' />
            <div>Area: {faceArea}</div>
            <div className={styles.container}>
                <div className={styles.photoCanvasContainer}>
                    <div className={styles.photoContainer}>
                        {photo && <img src={photo.src} alt='photo' />}
                    </div>
                    <canvas className={styles.canvas} ref={canvasRef} width={photoWidth} height={photoHeight} />
                </div>
            </div>
        </div>
    );
}

export default Home;
