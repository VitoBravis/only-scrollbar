import OnlyScroll, {ElementOrSelector, OnlyScrollEvents} from "../onlyScroll";

export const findElementBySelector = (selector: ElementOrSelector | null | undefined) => {
    if (selector !== window && selector !== document.scrollingElement) {
        return typeof selector === "string" ? document.querySelector<HTMLElement>(selector) : <HTMLElement>selector;
    } else {
        return <HTMLElement>document.scrollingElement ?? document.body;
    }
}

export const wheelCalculate = (wheelEvent: WheelEvent) => {
    let deltaY = wheelEvent.deltaY;
    let deltaX = wheelEvent.deltaX;

    if (wheelEvent.deltaMode) {
        const deltaMultiply = wheelEvent.deltaMode == 1 ? 40 : 800;
        deltaX *= deltaMultiply;
        deltaY *= deltaMultiply;
    }

    return {
        pixelX: deltaX,
        pixelY: deltaY
    }
}

export const emit = (container: OnlyScroll["eventContainer"], eventName: OnlyScrollEvents) => {
    const event = new CustomEvent(eventName);
    container.dispatchEvent(event)
}
