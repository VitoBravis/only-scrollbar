// @ts-nocheck

import OnlyScrollbar from "../src/onlyScrollbar";

const infoElement = document.querySelector('aside.info')!;

function infoUpdater() {
    infoElement.textContent = `window.scrollY = ${window.scrollY}px`
}

const scroll = new OnlyScrollbar(window);
scroll.addEventListener('scroll', infoUpdater, {passive: true});

