export declare type ElementOrSelector = HTMLElement | Window | string;
export declare type ClassNamesKeys = 'container' | 'lock' | 'scrolling' | 'back' | 'forward';
export declare type ClassNames = Record<ClassNamesKeys, string>;
export declare type AttributesKeys = 'anchor';
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

export interface IOnlyScrollbar {
    readonly scrollContainer: HTMLElement;
    readonly eventContainer: HTMLElement | Window;
    readonly axis: Axis;
    readonly damping: number;
    readonly speed: number;
    readonly setTargetPosition: (e: WheelEvent) => void;
    readonly tick: FrameRequestCallback;
    readonly direction: Direction;
    isLocked: boolean;
    position: number;
    targetPosition: number;
    easedPosition: number;
    lastPosition: number;
    syncTo?: NodeJS.Timeout;
    rafID: number | null;
    lastDirection: Direction | null;
    isDisable: boolean;

    updateDirection(): void;
    sync(): void;
    stop(): void;
    scrollTo(position: Partial<number>): void;
    setValue(position: Partial<number>): void;
    lock(): void;
    unlock(): void;
    addEventListener(type: OnlyScrollbarEvents | keyof HTMLElementEventMap, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void;
    removeEventListener(type: OnlyScrollbarEvents | keyof HTMLElementEventMap, listener: EventListenerOrEventListenerObject): void;
    destroy(): void;

    init(): void
    initEvents(): void;
    onScroll(e: Event): void;
    onWheel(e: Event): void;
    syncPos(): void;
    checkSyncTo(): void;
    manageParentScrollbars(currentTarget: HTMLElement): void;
    disable(): void;
    enable(): void;
}