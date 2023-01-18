import React, { DragEventHandler, FC, useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';

import './FilesDragAndDrop.scss';

interface FilesDragAndDropProps {
    selectedFiles?: File[];
    onUploadFiles:(files: File[]) => void;
};

const MAX_COUNT = 10;

export const FilesDragAndDrop: FC<FilesDragAndDropProps> = ({selectedFiles, onUploadFiles}) => {
    const container = useRef(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    /** store the blob links, bcs dragging new files (it will show 'Drop the files') will cause re-render of the image previews */
    const [fileBlobs, setFileBlobs] = useState<string[]>([]);

    const onDragOver: DragEventHandler = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);
    const onDragEnter: DragEventHandler = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    }, []);
    const onDragLeave: DragEventHandler = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    }, []);
    const onDrop: DragEventHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);

        // this is required to convert FileList object to array
        let files = [...e.dataTransfer.files];

        // do not exceed limit
        if (MAX_COUNT < files.length) {
            setErrorMessage(`Sorry, only ${MAX_COUNT} files can be uploaded at a time`);
            onUploadFiles([]);
            return;
        }

        // pick only images
        files = files.filter(_file => /^image\//.test(_file.type));
        if (!files.length) {
            setErrorMessage('Sorry, only image files are allowed');
            onUploadFiles([]);
            return;
        }
        
        onUploadFiles(files);
        setErrorMessage('');
    };

    const onClick: React.MouseEventHandler = (e) => {
        e.preventDefault();
        inputRef.current?.click();
    };

    useEffect(() => {
        setFileBlobs(
            selectedFiles?.map(_file => URL.createObjectURL(_file)) ?? []
        );
    }, [selectedFiles]);

    return (
        <>
            <div
            ref={container}
            className={cx('FilesDragAndDrop', {'isDragging': dragging, 'error': !!errorMessage})}
            style={selectedFiles?.length && !dragging ? undefined : {height: '196px'}}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onClick={onClick}
            >
                {dragging? 'Drop the files' : errorMessage ? errorMessage : selectedFiles?.length ? (
                    <div className='imagePreview'>
                        {selectedFiles?.map((_file, _index) => (
                            <img key={_index} src={fileBlobs[_index]} alt="image" />
                        ))}
                    </div>
                ) : (
                    <p className='defaultText'>Drag and drop the files here</p>
                )}
            </div>
            <input
                ref={inputRef}
                hidden
                type="file"
                name="file"
                multiple
                accept='image/*'
                onChange={(e) => {
                    if (e.target.files) {
                        onUploadFiles([...e.target.files]);
                        setErrorMessage('');
                    }
                }}
            />
        </>
      );
}