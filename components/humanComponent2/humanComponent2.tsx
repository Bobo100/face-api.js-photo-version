import React, { useRef, useState } from 'react'
import RunHuman from './RunHuman'
import styles from './humanComponent2.module.scss'

const HumanComponent2 = () => {
    const [human, setHuman] = useState(null);
    const [ready, setReady] = useState(false);
    const [pitch, setPitch] = useState(0);
    const [yaw, setYaw] = useState(0);
    const [roll, setRoll] = useState(0);
    const imageContainerRef = useRef(null);
    const imagesRef = useRef(null);
    const canvasRef = useRef(null);

    const radianToDegree = (radian: number) => {
        return radian * 180 / Math.PI;
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
                <div>
                    {`Pitch: ${radianToDegree(pitch)}`}
                </div>
                <div>
                    {`Yaw: ${radianToDegree(yaw)}`}
                </div>
                <div>
                    {`Roll: ${radianToDegree(roll)}`}
                </div>
            </div>
            <div className={styles.imageContainer}
                ref={imageContainerRef}
            >
                <img
                    ref={imagesRef}
                    alt="test"
                    id="image"
                />
                <canvas
                    className={styles.canvas}
                    ref={canvasRef} id="canvas"
                />
            </div>
            <RunHuman inputId="image" outputId="canvas" /> {/* loads and start human using specified input video element and output canvas element */}
        </div>
    )
}

export default HumanComponent2
