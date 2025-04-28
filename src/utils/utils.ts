import {Axis, InternalFields, OnlyScrollbarEvents} from "../types";

export const findElementBySelector = (selector: string | Window | HTMLElement | undefined | null): HTMLElement | null => {
    if (selector === window || selector === document.scrollingElement) {
        return <HTMLElement>document.scrollingElement ?? document.body;
    }

    if (typeof selector === "string") {
        return document.querySelector<HTMLElement>(selector);
    }

    return null
}

export const emit = (container: HTMLElement | Window, eventName: string & OnlyScrollbarEvents) => {
    const event = new CustomEvent(eventName);
    container.dispatchEvent(event)
}

export const getFieldsByAxis = (axis: Axis, listenAxis: Axis): InternalFields => {
    return {
        scrollOffset: axis === 'Y' ? 'scrollTop' : 'scrollLeft',
        scrollSize: axis === 'Y' ? 'scrollHeight' : 'scrollWidth',
        clientSize: axis === 'Y' ? 'clientHeight' : 'clientWidth',
        offset: axis === 'Y' ? 'top' : 'left',
        delta: listenAxis === 'Y' ? 'deltaY' : 'deltaX'
    }
}