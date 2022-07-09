import React, { FC, useEffect, useState } from 'react';
import { Image, Modal, Spinner } from 'react-bootstrap';
import { Navigation, Pagination, Mousewheel, Keyboard } from "swiper";
import { Swiper, SwiperSlide } from 'swiper/react';
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import photoService from '../api/photoService';
import './PhotoList.scss';

interface PhotoListProps {
    selectedFolder?: string;
}

export const PhotoList: FC<PhotoListProps> = (props) => {
    const {selectedFolder} = props;
    const [loading, setLoading] = useState(false);
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [show, setShow] = useState(false);
    const [highlightPhotoIndex, setHighlightPhotoIndex] = useState<number | undefined>();
    const fetchPhotos = async (folder: string) => {
        setLoading(true);
        try {
            const {URLs} = await photoService.getPhotos(folder);
            setPhotoUrls(URLs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (selectedFolder) {
            fetchPhotos(selectedFolder);
        }
    }, [selectedFolder]);

    return (
        <>
            {loading ? (
                <Spinner animation='border' className='loadingSpinner' />
            ) : (
                <div className='photoList-container'>
                    <div className='photoList'>
                        {photoUrls.map((url, idx) => (
                            <Image key={url} src={url} className='photoItem' onClick={() => {setShow(true); setHighlightPhotoIndex(idx);}} />
                        ))}
                    </div>
                </div>
            )}
            <Modal
                show={show}
                centered
                onHide={() => setShow(false)}
                onExited={() => setHighlightPhotoIndex(undefined)}
                dialogClassName="highlight-photo-modal"
            >
                <Modal.Body className='highlight-photo-body'>
                    <Swiper
                        autoHeight
                        navigation
                        pagination
                        mousewheel
                        keyboard
                        centeredSlides
                        grabCursor
                        loop
                        preloadImages={false}
                        initialSlide={highlightPhotoIndex}
                        modules={[Navigation, Pagination, Mousewheel, Keyboard]}
                    >
                        {photoUrls.map((url, idx) => (
                            <SwiperSlide key={idx}>
                                <Image key={url} src={url} className="highlight-photo-item" />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </Modal.Body>
            </Modal>
        </>
    );
};
