export declare type ElementOrSelector = HTMLHtmlElement | Element | Window | string;
declare type ClassNamesKeys = 'container' | 'lock';
declare type ClassNames = Record<ClassNamesKeys, string>;
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
     * @description Доступные направления скрола
     */
    mode?: OnlyScrollbarModes;
}
export interface Delta2D {
    x: number;
    y: number;
}
/**
 * @description Модификация нативного скрола, работающая по принципу перерасчета текущей позиции с помощью Безье функции.
 * @class
 * @version 1.0.3
 */
declare class OnlyScrollbar {
    /**
     * @description Объект со всеми css-классами, которые используются в скроле
     */
    static readonly classNames: ClassNames;
    /**
     * @description HTML-элемент, котороый будет являться контейнером для скрола
     * @description Для корректной работы размеры контейнера должны быть ограничены
     */
    readonly scrollContainer: HTMLElement;
    /**
     * @description HTML-элемент, на который будут применяться все события
     * @default OnlyScrollbar.scrollContainer
     */
    readonly eventContainer: HTMLElement | Window;
    /**
     * @description Состояние, отображающее блокировку скрола
     */
    isLocked: boolean;
    position: Delta2D;
    private targetPosition: Delta2D;
    private easedPosition: Delta2D;
    private lastPosition: Delta2D;
    readonly mode: OnlyScrollbarModes;
    readonly damping: number;
    private syncTo;
    private rafID: number | null;
    private lastDirection;
    private lastHash;
    private isDisable;
    private readonly setTargetPosition;
    private readonly tick: FrameRequestCallback;
    constructor(element: ElementOrSelector | null | undefined, options?: OnlyScrollbarOptions);
    /**
     * @description Последнее направление скрола в числовом представлении
     * @description 1 = Down|Right, -1 = Up|Left
     */
    get direction(): Direction;
    /**
     * @description Обновление направления скрола. Также устанавливает на scrollContainer атрибут data-scroll-direction со значениями "up" | "down"
     * @description Вызывается автоматически на скрол, но можно вызывать вручную на случай непредвиденных ошибок
     */
    updateDirection(): void;
    /**
     * @description Синхронизация всех значений, которые используются для расчета позиций
     * @description Вызывается автоматически по окончанию событий скрола, но можно вызвать вручную для преждевременной синхронизации и обнуления анимации
     */
    sync(): void;
    /**
     * @description Плавный скрол до конкретной позиции, с применением стандартных расчетов для вычисления промежуточных значений
     * @param positionY {number} - Числовое значение целевой позиции скрола
     */
    scrollTo({ x, y }: Partial<Delta2D>): void;
    /**
     * @description Установка конкретного значения скрол позиции, без применения каких-либо анимаций
     * @param value {number} - Числовое значение целевой позиции скрола
     */
    setValue({ x, y }: Partial<Delta2D>): void;
    /**
     * @description Блокирует скрол
     * @description Блокировка также прервет запущенные процессы по перерасчету позиции
     */
    lock(): void;
    /**
     * @description Разблокирует скрол, запускает перерасчет позиции скрола
     */
    unlock(): void;
    addEventListener(type: OnlyScrollbarEvents | keyof HTMLElementEventMap, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void;
    removeEventListener(type: OnlyScrollbarEvents | keyof HTMLElementEventMap, listener: EventListenerOrEventListenerObject): void;
    /**
     * @description Очистка событий, таймеров, классов и атрибутов
     */
    destroy(): void;
    private init;
    private initEvents;
    private onScroll;
    private onWheel;
    private syncPos;
    private checkSyncTo;
    private manageParentScrollbars;
    private disable;
    private enable;
}
export default OnlyScrollbar;
