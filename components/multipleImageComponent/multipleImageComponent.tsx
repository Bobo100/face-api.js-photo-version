import React, { useState, useRef, useEffect, Fragment } from 'react';
import * as faceapi from 'face-api.js';
import styles from './multipleImageComponent.module.scss';

function MultipleImageComponent() {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [photos, setPhotos] = useState<string[]>([]);
    const [faceAreas, setFaceAreas] = useState<number[]>([]);
    const [messages, setMessages] = useState<string[]>([]);
    const canvasRefs = useRef<HTMLCanvasElement[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';

            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            ]);

            setModelsLoaded(true);
        };

        loadModels();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
        const files = 'length' in e ? e : e.target.files; // 處理不同參數型別
        if (!files) return;
        const newPhotos: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const imageUrl = URL.createObjectURL(file);
            newPhotos.push(imageUrl);
        }

        setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
    };

    const removePhoto = (index: number) => {
        setPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== index));
        setFaceAreas(prevFaceAreas => prevFaceAreas.filter((_, i) => i !== index));
        setMessages(prevMessages => prevMessages.filter((_, i) => i !== index));
    };

    const handleImageLoad = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.target as HTMLImageElement;
        const imageUrl = img.src;
        const index = photos.indexOf(imageUrl);
        if (modelsLoaded && canvasRefs.current[index] && img.complete) {
            const canvas = canvasRefs.current[index];
            const displaySize = { width: img.width, height: img.height };
            faceapi.matchDimensions(canvas, displaySize);

            // SsdMobilenetv1Options
            // TinyFaceDetectorOptions
            const detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options())
                .withFaceLandmarks();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, img.width, img.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            // 檢查規則並顯示訊息
            const ruleMessages = [];
            const faceCount = detections.length;
            if (faceCount === 0) {
                ruleMessages.push('沒有偵測到人臉');
                setMessages(prevMessages => {
                    const newMessages = [...prevMessages];
                    newMessages[index] = ruleMessages.join('，');
                    return newMessages;
                });
                return;
            }
            if (faceCount > 1) {
                ruleMessages.push('偵測到多個人臉');
                setMessages(prevMessages => {
                    const newMessages = [...prevMessages];
                    newMessages[index] = ruleMessages.join('，');
                    return newMessages;
                });
                return;
            }

            const faceArea = faceCount > 0 ? (detections[0].detection.box.area / (detections[0].detection.imageHeight * detections[0].detection.imageWidth)) * 100 : 0;

            if (detections[0].detection.imageWidth < 640) {
                ruleMessages.push('寬度至少要有640px');
            }
            if (detections[0].detection.imageHeight < 480) {
                ruleMessages.push('高度至少要有480px');
            }
            if (faceArea < 10) {
                ruleMessages.push('face area至少要有10%');
            }

            setFaceAreas(prevFaceAreas => {
                const newFaceAreas = [...prevFaceAreas];
                newFaceAreas[index] = faceArea;
                return newFaceAreas;
            });
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                newMessages[index] = ruleMessages.join('，');
                return newMessages;
            });
        }
    }

    const handleDrop = (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            // 將拖放的文件設置到 input 元素
            inputRef.current.files = files;
            handleImageUpload(files);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div>
            <input
                className={styles.inputFile}
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                title='image'
            />
            <div className={styles.inputFileArea}
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}>
                <div className={styles.inputFileText}>Upload</div>
            </div>
            <div className={styles.sampleImageContainer}>
                {[...Array(5)].map((_, index) => (
                    <div key={index} className={styles.sampleImage}>
                        <img src={`/images/sample${index + 1}.jpg`}
                            alt={`sample${index + 1}`} className={styles.sampleImage}
                        />
                    </div>
                ))}
            </div>

            <div className={styles.container}>
                {photos.map((photo, index) => (
                    <div key={index} className={styles.photoCanvasContainer}>
                        <div className={styles.photoContainer}>
                            <img src={photo} alt='photo' className={styles.photo} onLoad={handleImageLoad} />
                            <canvas className={styles.overlayCanvas} ref={ref => canvasRefs.current[index] = ref!} />
                            <div className={styles.message}>{messages[index]}</div>
                            <button className={styles.removeButton} onClick={() => removePhoto(index)}>X</button>
                        </div>
                        <div>Area: {faceAreas[index]}%</div>
                    </div>
                ))}

            </div>
        </div>
    );
}

export default MultipleImageComponent;
