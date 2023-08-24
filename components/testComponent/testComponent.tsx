
import useDetectFace from '../use-detect-face'
import { useState, useRef } from 'react';
import styles from './testComponent.module.scss';

function testComponent() {
    const { detectFace } = useDetectFace();
    const [photos, setPhotos] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
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

    const handleImageLoad = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.target as HTMLImageElement;
        if (img.complete) {
            const result = await detectFace(img)
            console.log(result)
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                title='image'
            />
            {photos.map((photo, index) => (
                <div key={index}>
                    <img
                        className={styles.image}
                        src={photo}
                        alt="photo"
                        onLoad={handleImageLoad}
                    />
                </div>
            ))}
        </>
    )
}

export default testComponent