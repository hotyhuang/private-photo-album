import React, { FC, useEffect, useState } from 'react';
import { Accordion, Spinner } from 'react-bootstrap';
import cx from 'classnames';

import photoService from '../api/photoService';
import authService from '../api/authService';
import './NavMenu.scss';

/**
 * Used to get the grouped sub menu list, customize it with your own preference
 */
function getGroupedDateFolder(folders: string[]) {
    const grouped = folders.sort().reverse().reduce((res, folder) => {
        const [year] = folder.split('-');
        if (!res[year]) {
            res[year] = [];
        }
        res[year].push(folder);
        return res;
    }, {} as {[year: string]: string[]});

    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
}

interface NavMenuProps {
    setAuthorized: (value: boolean) => void;
    selectedFolder?: string;
    setSelectedFolder: (value: string) => void;
}

export const NavMenu: FC<NavMenuProps> = (props) => {
    const {setAuthorized, selectedFolder, setSelectedFolder} = props;
    const [show, setShow] = useState(true);
    const [loading, setLoading] = useState(true);
    const [folderEntries, setFolderEntries] = useState<[string, string[]][]>([]);

    const toggleShow = () => setShow(state => !state);

    const fetchList = async () => {
        try {
            const {folders} = await photoService.listFolders();
            const entries = getGroupedDateFolder(folders);
            setFolderEntries(entries);
            // the entries are already sorted, pick the 1st one to be selected folder
            if (entries[0] && entries[0][1]) {
                setSelectedFolder(entries[0][1][0]);
            }
        } catch (err: any) {
            if (err?.message === 'Your answers are incorrect') {
                await authService.addTryTime();
            }
            // this is the 1st API with auth
            // if this one failed, reset auth
            // console.error(err);
            authService.params = undefined;
            setAuthorized(false);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchList();
    }, []);

    return (
        <div className={cx('menu-container', show ? 'expand' : null)}>
            <div className='menu-header'>
                <div className='menu-button' onClick={toggleShow}>
                    <i className={show ? 'gg-arrow-left' : 'gg-menu'} />
                </div>
            </div>
            {show ? loading ? (
                <Spinner variant='warning' animation='border' className='menu-loadingSpinner' />
            ) : (
                <Accordion defaultActiveKey="0" flush className='menu-content'>
                    {folderEntries.map(([year, folderNames], index) => (
                        <Accordion.Item eventKey={`${index}`} key={year}>
                            <Accordion.Header className='menu-content-header'>{year}</Accordion.Header>
                            {folderNames.map((folder) => (
                                <Accordion.Body
                                    key={folder}
                                    className={cx('menu-content-item', selectedFolder === folder ? 'isActive' : null)}
                                    onClick={() => setSelectedFolder(folder)}
                                >
                                    {folder}
                                </Accordion.Body>
                            ))}
                        </Accordion.Item>
                    ))}
                </Accordion>
            ) : null}
        </div>
    );
};
