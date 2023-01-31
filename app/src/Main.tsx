import React, { FC, useRef, useState } from "react";
import authService from "./api/authService";
import { AuthModal } from "./components/AuthModal";
import { NavMenu } from "./components/NavMenu";

import { PhotoList } from "./components/PhotoList";
import { UploadButton } from "./components/UploadButton";
import './Main.scss';

export const Main: FC = () => {
    const [authorized, setAuthorized] = useState(authService.authorized);
    const [selectedFolder, setSelectedFolder] = useState<string>();

    const mainEleRef = useRef<HTMLDivElement>(null);

    if (!authorized) {
        return <AuthModal setAuthorized={setAuthorized} />
    }

    return (
        <div className="app-container">
            <div className="app-menu">
                <NavMenu setAuthorized={setAuthorized} selectedFolder={selectedFolder} setSelectedFolder={setSelectedFolder} />
            </div>
            <div className="app-header">
                <UploadButton />
            </div>
            <div ref={mainEleRef} className="app-main">
                <PhotoList selectedFolder={selectedFolder} mainEleRef={mainEleRef} />
            </div>
        </div>
    );
};
