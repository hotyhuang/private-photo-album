import React, { FC, useState } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import photoService from '../api/photoService';
import { FilesDragAndDrop } from './FilesDragAndDrop';

export const UploadButton: FC = () => {
    const [show, setShow] = useState(false);

    const handleClose = () => {
        if (loading) return;
        setShow(false);
    }
    const handleShow = () => setShow(true);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

	const handleUpload = async () => {
        try {
            setLoading(true);
            const resp = await photoService.bulkUpload(selectedFiles);
            if (resp.type === 'partial') {
                setSelectedFiles([]);
                setErrorMsg(`${resp.numOfFailed} photos failed, but the rest of them are successful`);
            } else {
                handleClose();
            }
        } catch (err) {
            setSelectedFiles([]);
            setErrorMsg('Something wrong, please try again later');
        } finally {
            setLoading(false);
        }
	};

    return (
    <>
        <Button variant="primary" onClick={handleShow} disabled={loading}>
            Upload photo
        </Button>

        <Modal
            centered
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            show={show}
            onHide={handleClose}
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Please upload your images here
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FilesDragAndDrop selectedFiles={selectedFiles} onUploadFiles={setSelectedFiles} />
                {!!errorMsg && (
                    <p style={{color: '#842029'}}>{errorMsg}</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={loading}>
                    Close
                </Button>
                <Button variant="primary" disabled={loading || !selectedFiles.length || selectedFiles.length > 10} onClick={handleUpload}>
                    {loading ? (
                        <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                        />
                    ) : null}
                    {loading ? 'Uploading...' : 'Upload'}
                </Button>
            </Modal.Footer>
        </Modal>
    </>
    );
};
