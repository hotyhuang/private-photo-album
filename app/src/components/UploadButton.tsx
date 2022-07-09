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

	const handleUpload = async () => {
        try {
            setLoading(true);
            const resp = await photoService.bulkUpload(selectedFiles);
            if (resp.type === 'partial') {
                // handle partial
            }

            handleClose();
        } catch (err) {
            console.error(err);
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
