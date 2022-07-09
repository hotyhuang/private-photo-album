import { createElement } from "react";
import { createRoot } from 'react-dom/client';
import { Main } from "./Main";

import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.scss";

export class App
{
    constructor()
    {
        this.render();
    }

    private render(): void
    {
        const root = createRoot(document.getElementById("app") || document.createElement("div"));
        root.render(createElement(Main));
    }
}

new App();