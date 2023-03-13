import React, { FC, useCallback, useEffect, useState } from 'react';
import { Accordion, Spinner } from 'react-bootstrap';
import cx from 'classnames';

import photoService from '../api/photoService';
import authService from '../api/authService';
import './NavMenu.scss';

type YearFolder = {
    year: string;
    months: string[];
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Used to get the grouped sub menu list, customize it with your own preference
 * @returns a list, each item represents one year
 */
function getGroupedDateFolder(folders: string[]): YearFolder[] {
    // remove the prefix 'thumbnail-', bcs the list API only contains the thumbnails now
    folders = folders.map(folder => folder.replace(/^thumbnail-/, ''));
    const grouped = folders.sort().reverse().reduce((res, folder) => {
        const [year, month] = folder.split('-');
        if (!res[year]) {
            res[year] = [];
        }
        if (!!month) {
            res[year].push(month);
        }
        return res;
    }, {} as {[year: string]: string[]});

    return Object.entries(grouped)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([year, months]) => ({year, months}));
}

function isPhoneScreen() {
    return window.screen.width < 768;
}

interface NavMenuProps {
    setAuthorized: (value: boolean) => void;
    selectedFolder?: string;
    setSelectedFolder: (value: string) => void;
}

export const NavMenu: FC<NavMenuProps> = (props) => {
    const {setAuthorized, selectedFolder, setSelectedFolder} = props;
    const [show, setShow] = useState(() => isPhoneScreen() ? false : true);
    const [loading, setLoading] = useState(true);
    const [yearFolders, setYearFolders] = useState<YearFolder[]>([]);

    const toggleShow = () => setShow(state => !state);

    const fetchList = async () => {
        try {
            const {folders} = await photoService.listFolders();
            const _yFolders = getGroupedDateFolder(folders);
            setYearFolders(_yFolders);
            // the entries are already sorted, pick the 1st one to be selected folder
            if (_yFolders[0] && _yFolders[0].year) {
                const {year, months} = _yFolders[0];
                setSelectedFolder(`${year}-${months[0]}`);
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

    const chooseFolder = useCallback((folderName: string) => {
        setSelectedFolder(folderName);
        if (isPhoneScreen()) {
            setShow(false);
        }
    }, []);

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
            {loading ? (
                <Spinner variant='warning' animation='border' className='menu-loadingSpinner' />
            ) : (
                <Accordion defaultActiveKey={['0']} alwaysOpen className='menu-content'>
                    {yearFolders.map(({year, months}, index) => (
                        <Accordion.Item eventKey={`${index}`} key={year}>
                            <Accordion.Header className={cx(
                                'menu-content-header',
                                show ? null : 'mini-view',
                            )}>
                                {year}
                            </Accordion.Header>
                            {months.map((_month) => (
                                <Accordion.Body
                                    key={`${year}-${_month}`}
                                    className={cx(
                                        'menu-content-item',
                                        selectedFolder === `${year}-${_month}` ? 'isActive' : null,
                                        show? null : 'mini-view',
                                    )}
                                    onClick={() => chooseFolder(`${year}-${_month}`)}
                                >
                                    {MONTH_SHORT[+_month - 1]}
                                </Accordion.Body>
                            ))}
                        </Accordion.Item>
                    ))}
                </Accordion>
            )}
        </div>
    );
};
