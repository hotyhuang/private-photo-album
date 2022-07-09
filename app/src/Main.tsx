import React, { FC, useState } from "react";
import authService from "./api/authService";
import { AuthModal } from "./components/AuthModal";
import { NavMenu } from "./components/NavMenu";

import { PhotoList } from "./components/PhotoList";
import { UploadButton } from "./components/UploadButton";
import './Main.scss';

export const Main: FC = () => {
    const [authorized, setAuthorized] = useState(authService.authorized);
    const [selectedFolder, setSelectedFolder] = useState<string>();

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
            <div className="app-main">
                <PhotoList selectedFolder={selectedFolder} />
            </div>
        </div>
    );
};
