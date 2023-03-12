import React, { FC, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Image, Modal, Spinner } from 'react-bootstrap';
import { Navigation, Mousewheel, Keyboard } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/lazy';

import PlaySvg from '../assets/play-button.svg';

import photoService from '../api/photoService';
import './PhotoList.scss';

interface PhotoListProps {
    selectedFolder?: string;
    mainEleRef: RefObject<HTMLDivElement>;
}

interface Photo {
    thumbnail: string;
    url: string;
    type: 'img' | 'video';
}

export const PhotoList: FC<PhotoListProps> = (props) => {
    const {selectedFolder, mainEleRef} = props;
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [show, setShow] = useState(false);
    const [highlightPhotoIndex, setHighlightPhotoIndex] = useState<number | undefined>();

    const loadMoreFn = useRef<() => {}>();

    const loadMoreFnGenerator = useCallback(
        (folder: string, options: {token: string; thumbnailToken?: string; accPhotos: Photo[]}) => {
            return async () => {
                const {scrollTop, scrollHeight, clientHeight} = mainEleRef.current as HTMLDivElement;

                if (scrollTop + clientHeight > scrollHeight - 100) {
                    // remove listener to avoid duplicate loading
                    if (loadMoreFn.current) {
                        mainEleRef.current?.removeEventListener('scroll', loadMoreFn.current);
                    }

                    await fetchPhotos(folder, options);
                }
            };
        }, []);

    const fetchPhotos = async (
        folder: string,
        options: {token?: string; thumbnailToken?: string; accPhotos?: Photo[]} = {}
    ): Promise<void> => {
        setLoading(true);
        try {
            const {token, thumbnailToken, accPhotos} = options;
            const [
                thumbnailResp,
                resp,
            ] = await Promise.all([
                photoService.getPhotos(folder, thumbnailToken, true),
                photoService.getPhotos(folder, token, false),
            ]);

            // 't_' for thumbnail, 'o_' for original
            const {URLs: t_urls, continuationToken: t_token} = thumbnailResp;
            const {URLs: o_urls, continuationToken: o_token, isTruncated: o_istruncated} = resp;

            let _photos: Photo[] = o_urls.map(_url => {
                let type: Photo['type'] = 'img';
                if (/\.(mp4|ogg|webm|mov)\?/i.test(_url)) {
                    type = 'video';
                }

                const fileName = _url.match(/^https?.*\/(.*)\.\w+\?/)?.[1];
                if (!fileName) {
                    return {thumbnail: _url, url: _url, type};
                }
                // look for the thumbnail url, which must have the same name
                const _thumbnail = t_urls.find(_url2 => fileName === _url2.match(/^https?.*\/(.*)\.\w+\?/)?.[1]);
                if (!_thumbnail) {
                    return {thumbnail: _url, url: _url, type};
                }
                return {thumbnail: _thumbnail, url: _url, type};
            });

            // with continuation token
            if (token && accPhotos) {
                _photos = [...accPhotos, ..._photos];
            }
            setPhotos(_photos);

            // We just need to check the origin, bcs photos can be loaded even thumbnails missing
            if (o_istruncated && o_token) {
                loadMoreFn.current = loadMoreFnGenerator(
                    folder,
                    {token: o_token, thumbnailToken: t_token, accPhotos: _photos}
                );
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
            // reset the photo urls, bcs this is selecting another folder
            setPhotos([]);
            fetchPhotos(selectedFolder);
        }
    }, [selectedFolder]);

    return (
        <>
            <div className='photoList-container'>
                <div className='photoList'>
                    {photos.map((photoUrl, idx) => (
                        <div key={photoUrl.thumbnail} className='photoItem' onClick={() => {setShow(true); setHighlightPhotoIndex(idx);}}>
                            {photoUrl.type === 'img' ? (
                                <Image src={photoUrl.thumbnail} loading='lazy' />
                            ) : (
                                <div className='item-video'>
                                    <div className='playbutton-backdrop'>
                                        <img src={PlaySvg} alt='Play' />
                                    </div>
                                    <video>
                                        <source src={photoUrl.thumbnail} />
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
                        {photos.map((photoUrl, idx) => (
                            <SwiperSlide key={idx} className='highlight-photo-item'>
                                {photoUrl.type === 'img' ? (
                                    <Image key={photoUrl.url} src={photoUrl.url} loading='lazy' className='highlight-photo-item-img' />
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
