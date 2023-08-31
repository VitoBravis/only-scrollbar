import './demo.css';
import OnlyScrollbar from "../src/onlyScrollbar.js";

const scroll = new OnlyScrollbar(window, { damping: 0.7 })
const infoElement = document.querySelector('aside.info');

function infoUpdater() {
    infoElement.textContent = `window.scrollY = ${window.scrollY}px`
}

scroll.addEventListener('scroll', infoUpdater, {passive: true})