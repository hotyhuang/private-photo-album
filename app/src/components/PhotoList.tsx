import React, { FC, RefObject, useCallback, useEffect, useRef, useState } from 'react';
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
    mainEleRef: RefObject<HTMLDivElement>;
}

interface PhotoUrl {
    url: string;
    type: 'img' | 'video';
}

export const PhotoList: FC<PhotoListProps> = (props) => {
    const {selectedFolder, mainEleRef} = props;
    const [loading, setLoading] = useState(false);
    const [photoUrls, setPhotoUrls] = useState<PhotoUrl[]>([]);
    const [show, setShow] = useState(false);
    const [highlightPhotoIndex, setHighlightPhotoIndex] = useState<number | undefined>();

    const loadMoreFn = useRef<() => {}>();

    const loadMoreFnGenerator = useCallback((folder: string, token: string, accPhotos: PhotoUrl[]) => {
        return async () => {
            const {scrollTop, scrollHeight, clientHeight} = mainEleRef.current as HTMLDivElement;

            if (scrollTop + clientHeight > scrollHeight - 100) {
                // remove listener to avoid duplicate loading
                if (loadMoreFn.current) {
                    mainEleRef.current?.removeEventListener('scroll', loadMoreFn.current);
                }

                await fetchPhotos(folder, token, accPhotos);
            }
        };
    }, []);

    const fetchPhotos = async (folder: string, token?: string, accPhotos?: PhotoUrl[]) => {
        setLoading(true);
        try {
            const {URLs, continuationToken, isTruncated} = await photoService.getPhotos(folder, {params: {continuationToken: token}});

            let _photoUrls: PhotoUrl[] = URLs.map(_url => {
                if (/\.(mp4|ogg|webm|mov)\?/i.test(_url)) {
                    return {url: _url, type: 'video'};
                }
                return {url: _url, type: 'img'};
            });

            // with continuation token
            if (token && accPhotos) {
                _photoUrls = [...accPhotos, ..._photoUrls];
            }
            setPhotoUrls(_photoUrls);

            if (isTruncated && continuationToken) {
                loadMoreFn.current = loadMoreFnGenerator(folder, continuationToken, _photoUrls);

                mainEleRef.current?.addEventListener('scroll', loadMoreFn.current);
            } else if (loadMoreFn.current) {
                mainEleRef.current?.removeEventListener('scroll', loadMoreFn.current);
            }
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
                {loading && (<Spinner animation='border' className='loadingSpinner' />)}
            </div>
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
