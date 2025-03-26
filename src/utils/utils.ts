import {Delta2D} from "../types";

export const findElementBySelector = (selector: string | Window | HTMLElement | undefined | null): HTMLElement | null => {
    if (selector === window || selector === document.scrollingElement) {
        return <HTMLElement>document.scrollingElement ?? document.body;
    }

    if (typeof selector === "string") {
        return document.querySelector<HTMLElement>(selector);
    }

    return null
}

export const wheelCalculate = (wheelEvent: WheelEvent, speed: number): Delta2D => {
    let deltaY = wheelEvent.deltaY;
    let deltaX = wheelEvent.deltaX;

    if (wheelEvent.deltaMode) {
        const deltaMultiply = wheelEvent.deltaMode === 1 ? 40 : 800;
        deltaX *= deltaMultiply;
        deltaY *= deltaMultiply;
    }

    deltaX *= speed;
    deltaY *= speed;

    return {
        x: deltaX,
        y: deltaY
    }
}

export const emit = (container: HTMLElement | Window, eventName: string) => {
    const event = new CustomEvent(eventName);
    container.dispatchEvent(event)
}