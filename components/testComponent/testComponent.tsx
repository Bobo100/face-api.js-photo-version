
import useDetectFace from '../use-detect-face'
import { useState, useRef } from 'react';
import styles from './testComponent.module.scss';

function testComponent() {
    const { detectFace } = useDetectFace();
    const [photos, setPhotos] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const [messages, setMessages] = useState<string[]>([]);
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

        const imageUrl = img.src;
        const index = photos.indexOf(imageUrl);

        if (img.complete) {
            const message = await detectFace(img)
            console.log(message)
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                newMessages[index] = message.message.join(' ');
                return newMessages;
            });
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
                    {messages[index]}
                </div>
            ))}
        </>
    )
}

export default testComponent