const findElementBySelector = (selector) => {
    if (selector !== window && selector !== document.scrollingElement) {
        return typeof selector === "string" ? document.querySelector<HTMLElement>(selector) : selector;
    } else {
        return document.scrollingElement ?? document.body;
    }
}

const wheelCalculate = (wheelEvent) => {
    let deltaY = wheelEvent.deltaY;
    let deltaX = wheelEvent.deltaX;

    if (wheelEvent.deltaMode) {
        const deltaMultiply = wheelEvent.deltaMode === 1 ? 40 : 800;
        deltaX *= deltaMultiply;
        deltaY *= deltaMultiply;
    }

    return {
        x: deltaX,
        y: deltaY
    }
}

const emit = (container, eventName) => {
    const event = new CustomEvent(eventName);
    container.dispatchEvent(event)
}

export { wheelCalculate, findElementBySelector, emit }
