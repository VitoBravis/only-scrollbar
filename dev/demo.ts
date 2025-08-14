// @ts-nocheck

import './demo.css';
import OnlyScrollbar from "../src/onlyScrollbar";

const infoElement = document.querySelector('aside.info')!;

function infoUpdater() {
    infoElement.textContent = `window.scrollY = ${window.scrollY}px`
}

const scroll = new OnlyScrollbar(window, { damping: 1, speed: 0.9 });
scroll.addEventListener('scroll', infoUpdater, {passive: true});
// scroll.addEventListener('os:stop', () => console.log('end'));
// const scroll1 = new OnlyScrollbar('.scroll-1', { damping: 1, speed: 0.9 })
// const scroll2 = new OnlyScrollbar('.scroll-2', { damping: 1, speed: 0.9 })

