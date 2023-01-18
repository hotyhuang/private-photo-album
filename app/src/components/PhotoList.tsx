import React, { FC, useEffect, useState } from 'react';
import { Image, Modal, Spinner } from 'react-bootstrap';
import { Navigation, Mousewheel, Keyboard } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import PlaySvg from '../assets/play-button.svg';

import photoService from '../api/photoService';
import './PhotoList.scss';

interface PhotoListProps {
    selectedFolder?: string;
}

interface PhotoUrl {
    url: string;
    type: 'img' | 'video';
}

export const PhotoList: FC<PhotoListProps> = (props) => {
    const {selectedFolder} = props;
    const [loading, setLoading] = useState(false);
    const [photoUrls, setPhotoUrls] = useState<PhotoUrl[]>([]);
    const [show, setShow] = useState(false);
    const [highlightPhotoIndex, setHighlightPhotoIndex] = useState<number | undefined>();
    const fetchPhotos = async (folder: string) => {
        setLoading(true);
        try {
            const {URLs} = await photoService.getPhotos(folder);

            const _photoUrls: PhotoUrl[] = URLs.map(_url => {
                if (/\.(mp4|ogg|webm|mov)\?/i.test(_url)) {
                    return {url: _url, type: 'video'};
                }
                return {url: _url, type: 'img'};
            });

            setPhotoUrls(_photoUrls);
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
                        {photoUrls.map((photoUrl, idx) => (
                            <div key={photoUrl.url} className='photoItem' onClick={() => {setShow(true); setHighlightPhotoIndex(idx);}}>
                                {photoUrl.type === 'img' ? (
                                    <Image src={photoUrl.url} />
                                ) : (
                                    <div className='item-video'>
                                        <div className='playbutton-backdrop'>
                                            <img src={PlaySvg} alt='Play' />
                                        </div>
                                        <video>
                                            <source src={photoUrl.url} />
                                        </video>
                                    </div>
                                    
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <Modal
                show={show}
                centered
                onHide={() => setShow(false)}
                onExited={() => setHighlightPhotoIndex(undefined)}
                dialogClassName='highlight-photo-modal'
                contentClassName='highlight-photo-modal-content'
            >
                <Modal.Body className='highlight-photo-body'>
                    <div className='cancel-icon' onClick={() => setShow(false)} />
                    <Swiper
                        className='highlight-photo-swiper'
                        navigation
                        pagination
                        mousewheel
                        keyboard
                        centeredSlides
                        grabCursor
                        loop
                        lazy
                        preloadImages={false}
                        initialSlide={highlightPhotoIndex}
                        modules={[Navigation, Mousewheel, Keyboard]}
                    >
                        {photoUrls.map((photoUrl, idx) => (
                            <SwiperSlide key={idx} className='highlight-photo-item'>
                                {photoUrl.type === 'img' ? (
                                    <Image key={photoUrl.url} src={photoUrl.url} className='highlight-photo-item-img' />
                                ) : (
                                    <video key={photoUrl.url} controls className='highlight-photo-item-img'>
                                        <source src={photoUrl.url} />
                                    </video>
                                )}
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </Modal.Body>
            </Modal>
        </>
    );
};
