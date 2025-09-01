export declare type ElementOrSelector = HTMLElement | Window | string;
export declare type ClassNamesKeys = 'container' | 'lock' | 'scrolling';
export declare type ClassNames = Record<ClassNamesKeys, string>;
export declare type AttributesKeys = 'anchor' | 'anchorId' | 'direction';
export declare type Attributes = Record<AttributesKeys, string>;
/**
 * @description Направление скрола
 * @description 1 = Down|Right, -1 = Up|Left
 */
export declare type Direction = -1 | 1;
/**
 * @description Функция-обработчик для события скрола
 */
export declare type EventHandler = (e: Event) => void;
export declare type OnlyScrollbarEvents = 'os:stop' | 'os:start' | 'os:change' | 'os:reachStart' | 'os:reachEnd' | 'os:lock' | 'os:unlock';
export declare type Events = Record<string, OnlyScrollbarEvents>
export declare type Axis = 'Y' | 'X';
export declare type InternalFields = {
    scrollOffset: 'scrollTop' | 'scrollLeft';
    scrollSize: 'scrollHeight' | 'scrollWidth';
    clientSize: 'clientHeight' | 'clientWidth';
    offset: 'top' | 'left';
    delta: 'deltaY' | 'deltaX';
}
export declare type AnchorsOptions = {
    offset: number;
    stopPropagation: boolean;
    active: boolean;
    root: HTMLElement;
    type: 'native' | 'custom';
}
export interface OnlyScrollbarOptions {
    /**
     * @description Сила инерции в формате числа от 0 до 1
     * @default 1
     */
    damping?: number
    /**
     * @description Контейнер, на который будут применяться события скрола
     * @default scrollContainer
     */
    eventContainer?: ElementOrSelector | Window;
    /**
     * @description Модификатор скорости для колесика мыши
     * @default 1
     */
    speed?: number;
    anchors?: Partial<AnchorsOptions>;
    listenAxis?: Axis;
    /**
     * @description Доступные направления скрола
     * @default Y
     */
    axis?: Axis;
}