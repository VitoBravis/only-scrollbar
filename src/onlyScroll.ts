declare type ElementOrSelector = HTMLHtmlElement | Element | Window | string;
declare type Easing = 'default';
declare type ClassNames = {
    [key in string]: string;
};
/**
 * @description Направление скрола
 * @description 1 = Up, -1 = Down
 */
export declare type Direction = -1 | 1;
/**
 * @description Функция-обработчик для события скрола
 */
export declare type EventHandler = (e: Event) => void;
export interface OnlyScrollOptions {
    /**
     * @description Сила инерции в формате числа от 0 до 1
     * @default 1
     */
    dumping?: number;
    /**
     * @description Контейнер, на который будут применяться события скрола
     * @default scrollContainer
     */
    eventContainer?: ElementOrSelector | Window;
    /**
     *  @todo: Пока не используется, планируется редактируемость кривой Безье
     */
    easing?: Easing;
}
/**
 * @todo Вынести все оаписания типов в отдельный файл
 * @todo Задокументировать приватные методы и поля класса
 * @todo Настроить нормальную сборку с минифицированием собранных файлов
 * @todo Добавить поддержку горизонтального скрола
 * @todo Добавить поддержку дополнительных кривых Безье
 */
/**
 * @description Модификкация нативного скрола, работающая по принципу перерасчета текущей позиции с помощью Безье функции.
 * @description Пока не работает на старых браузеров, которые не поддерживают пассивные события
 * @class
 * @version 0.1.0
 */
declare class OnlyScroll {
    /**
     * @description Объект со всеми css-классами, которые используются в скроле
     */
    readonly classNames: ClassNames;
    /**
     * @description HTML-элемент, котороый будет являться контейнером для скрола
     * @description Для корректной работы размеры контейнера должны быть ограничены
     */
    readonly scrollContainer: HTMLElement;
    /**
     * @description HTML-элемент, на который будут применяться все события
     * @default OnlyScroll.scrollContainer
     */
    readonly eventContainer: Element | Window;
    /**
     * @description Текущее ускорение скрола. Во внутренних расчетах не используется
     */
    velocity: number;
    /**
     * @description Текущий прогресс скрола, в числовом представлении от 0 до 100
     */
    progress: number;
    /**
     * @description Состояние, отображающее блокировку скрола
     */
    isLocked: boolean;
    private readonly dumping;
    private readonly navKeys;
    private syncTo;
    private rafID;
    private easedY;
    private lastY;
    private targetY;
    private scrollY;
    private lastPosition;
    private lastDirection;
    private lastHash;
    constructor(element: ElementOrSelector | null | undefined, options?: OnlyScrollOptions);
    /**
     * @description Последнее направление скрола в числовом представлении
     * @description 1 = Up, -1 = Down
     */
    get direction(): Direction;
    /**
     * @description Текущее значение позиции скрола
     */
    get y(): number;
    /**
     * @description Обновление направления скрола. Также устанавливает на scrollContainer атрибут data-scroll-direction со значениями "up" | "down"
     * @description Вызывается автоматически на скрол, но можно вызывать вручную на случай непредвиденных ошибок
     * @todo Сделать приватным методом, когда всё точно будет норм работать
     */
    updateDirection: () => void;
    /**
     * @description Синхронизация всех значений, которые используются для расчета позиций
     * @description Вызывается автоматически по окончанию событий скрола, но можно вызвать вручную для преждевременной синхронизации и обнуления анимации
     */
    sync: () => void;
    /**
     * @description Плавный скрол до конкретной позиции, с применением стандартных расчетов для вычисления промежуточных значений
     * @param positionY {number} - Числовое значение целевой позиции скрола
     */
    scrollTo: (positionY: number) => void;
    /**
     * @description Установка конкретного значения скрол позиции, без применения каких-либо анимаций
     * @param value {number} - Числовое значение целевой позиции скрола
     */
    setValue: (value: number) => void;
    /**
     * @description Блокирует скрол
     * @description Блокировка также прервет запущенные процессы по перерасчету позиции
     */
    lock: () => void;
    /**
     * @description Разблокирует скрол, запускает перерасчет позиции скрола
     */
    unlock: () => void;
    /**
     * @description Добавляет обработчик события скрола на eventContainer
     * @param eventHandler {function} - Стандартная функция обработчик события скрола
     */
    addScrollListener: (eventHandler: EventHandler) => void;
    /**
     * @description Удаляет существующий обработчик события скрола на eventContainer
     * @param eventHandler {function} - Стандартная функция обработчик события скрола
     */
    removeScrollListener: (eventHandler: EventHandler) => void;
    /**
     * @description Очистка событий, таймеров, классов и атрибутов
     * @description Не очищает сторонние обработчики, добавленные через addScrollListener
     */
    destroy: () => void;
    private findElementBySelector;
    private init;
    private initEvents;
    private findInitialAnchor;
    private onScroll;
    private onKeyUp;
    private onWheel;
    private syncPos;
    private checkSyncTo;
    private wheelCalculate;
    private manageParentScrollbars;
    private tick;
}
export default OnlyScroll;
