export declare type ElementOrSelector = HTMLElement | Window | string;
export declare type ClassNamesKeys = 'container' | 'lock';
export declare type ClassNames = Record<ClassNamesKeys, string>;
/**
 * @description Направление скрола
 * @description 1 = Down|Right, -1 = Up|Left
 */
export declare type Direction = Record<keyof Delta2D, -1 | 1>;
/**
 * @description Функция-обработчик для события скрола
 */
export declare type EventHandler = (e: Event) => void;
export declare type OnlyScrollbarEvents = 'scrollEnd' | 'changeDirectionY' | 'changeDirectionX';
export declare type OnlyScrollbarModes = 'vertical' | 'horizontal' | 'free';
export interface OnlyScrollbarOptions {
    /**
     * @description Сила инерции в формате числа от 0 до 1
     * @default 1
     */
    damping?: number;
    /**
     * @description Контейнер, на который будут применяться события скрола
     * @default scrollContainer
     */
    eventContainer?: ElementOrSelector | Window;
    /**
     * @description Модификатор для скорости колесика мыши
     * @default 1
     */
    speed?: number;
    scrollAnchors?: {
        type: 'native' | 'custom';
        options?: {
            attribute?: string;
            offset?: number;
            stopPropagation?: boolean;
        }
    }
    /**
     * @description Доступные направления скрола
     */
    mode?: OnlyScrollbarModes;
}
export interface Delta2D {
    x: number;
    y: number;
}

export interface IOnlyScrollbar {
    readonly scrollContainer: HTMLElement;
    readonly eventContainer: HTMLElement | Window;
    readonly mode: OnlyScrollbarModes;
    readonly damping: number;
    readonly speed: number;
    readonly setTargetPosition: (e: WheelEvent) => void;
    readonly tick: FrameRequestCallback;
    readonly direction: Direction;
    isLocked: boolean;
    position: Delta2D;
    targetPosition: Delta2D;
    easedPosition: Delta2D;
    lastPosition: Delta2D;
    syncTo?: NodeJS.Timeout;
    rafID: number | null;
    lastDirection: Direction | null;
    isDisable: boolean;

    updateDirection(): void;
    sync(): void;
    stop(): void;
    scrollTo(position: Partial<Delta2D>): void;
    setValue(position: Partial<Delta2D>): void;
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