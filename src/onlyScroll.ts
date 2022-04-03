type ElementOrSelector = HTMLHtmlElement | Element | Window | string;
type Easing = 'default';
type ClassNamesKeys = 'container' | 'lock';
type ClassNames = { [key in ClassNamesKeys]: string };
/**
 * @description Направление скрола
 * @description 1 = Up, -1 = Down
 */
export type Direction = -1 | 1
/**
 * @description Функция-обработчик для события скрола
 */
export type EventHandler = (e: Event) => void;

export interface OnlyScrollOptions {
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
    easing?: Easing;
}

/**
 * @description Набор настроек скрола по умолчанию
 */
const defaultOptions = {
    damping: 1,
    easing: "default",
}

/**
 * @description Список клавиш, нажатие которых должно вызывать событие по синхронизации позиции скрола
 */
const defaultNavKeys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'PageDown', 'PageUp', 'Home', 'End', ' '];

/**
 * @description Модификкация нативного скрола, работающая по принципу перерасчета текущей позиции с помощью Безье функции.
 * @description Пока не работает на старых браузеров, которые не поддерживают пассивные события
 * @class
 * @version 0.2.5
 */
class OnlyScroll {
    /**
     * @description Объект со всеми css-классами, которые используются в скроле
     */
    public readonly classNames: ClassNames = {
        container: 'only-scroll-container',
        lock: 'only-scroll--is-locked',
    };
    /**
     * @description HTML-элемент, котороый будет являться контейнером для скрола
     * @description Для корректной работы размеры контейнера должны быть ограничены
     */
    public readonly scrollContainer: HTMLElement;
    /**
     * @description HTML-элемент, на который будут применяться все события
     * @default OnlyScroll.scrollContainer
     */
    public readonly eventContainer: HTMLElement | Window;
    /**
     * @description Текущее ускорение скрола. Во внутренних расчетах не используется
     */
    public velocity: number;
    /**
     * @description Текущий прогресс скрола, в числовом представлении от 0 до 100
     */
    public progress: number;
    /**
     * @description Состояние, отображающее блокировку скрола
     */
    public isLocked: boolean;

    private readonly damping: number;
    private readonly navKeys: string[];
    private syncTo: NodeJS.Timeout | undefined;
    private rafID: number | null;
    private easedY: number;
    private lastY: number;
    private targetY: number;
    private scrollY: number;
    private lastPosition: number;
    private lastDirection: Direction | null;
    private lastHash: string;
    private listeners: Set<EventHandler>;

    constructor(element: ElementOrSelector | null | undefined, options?: OnlyScrollOptions) {
        const _scrollContainer =  this.findElementBySelector(element);

        if (!_scrollContainer) throw new Error('scrollElement does not exist');

        this.scrollContainer = _scrollContainer;

        const _eventContainer = this.findElementBySelector(options?.eventContainer) ?? this.scrollContainer;
        this.eventContainer = _eventContainer === document.scrollingElement ? window : _eventContainer;

        this.scrollY = 0;
        this.easedY = 0;
        this.targetY = 0;
        this.lastY = 0;
        this.velocity = 0;
        this.progress = 0;
        this.lastPosition = 0;
        this.lastDirection = null;
        this.isLocked = false;
        this.rafID = null
        this.damping = (options?.damping ?? defaultOptions.damping) * 0.1;
        this.navKeys = defaultNavKeys;
        this.lastHash = window.location.hash;
        this.listeners = new Set();

        this.init();
    }

    /**
     * @description Последнее направление скрола в числовом представлении
     * @description 1 = Up, -1 = Down
     */
    public get direction(): Direction {
        return this.scrollY > this.lastPosition ? 1 : -1
    }

    /**
     * @description Текущее значение позиции скрола
     */
    public get y(): number {
        return this.scrollY;
    }

    /**
     * @description Обновление направления скрола. Также устанавливает на scrollContainer атрибут data-scroll-direction со значениями "up" | "down"
     * @description Вызывается автоматически на скрол, но можно вызывать вручную на случай непредвиденных ошибок
     */
    public updateDirection = () => {
        this.lastPosition = this.scrollY;
        this.scrollY = this.scrollContainer.scrollTop;
        if (this.direction !== this.lastDirection) {
            this.scrollContainer.dataset.scrollDirection = this.direction === 1 ? "down" : "up";
            this.lastDirection = this.direction;
        }
    }

    /**
     * @description Синхронизация всех значений, которые используются для расчета позиций
     * @description Вызывается автоматически по окончанию событий скрола, но можно вызвать вручную для преждевременной синхронизации и обнуления анимации
     */
    public sync = () => {
        this.syncPos();
        this.rafID = null
    }

    /**
     * @description Плавный скрол до конкретной позиции, с применением стандартных расчетов для вычисления промежуточных значений
     * @param positionY {number} - Числовое значение целевой позиции скрола
     */
    public scrollTo = (positionY: number) => {
        this.targetY = positionY;
        this.tick();
    }

    /**
     * @description Установка конкретного значения скрол позиции, без применения каких-либо анимаций
     * @param value {number} - Числовое значение целевой позиции скрола
     */
    public setValue = (value: number) => {
        this.scrollContainer.scrollTop = value;
        this.sync()
    }

    /**
     * @description Блокирует скрол
     * @description Блокировка также прервет запущенные процессы по перерасчету позиции
     */
    public lock = () => {
        this.scrollContainer.classList.add(this.classNames.lock);
        this.isLocked = true
        this.sync();
    }

    /**
     * @description Разблокирует скрол, запускает перерасчет позиции скрола
     */
    public unlock = () => {
        this.scrollContainer.classList.remove(this.classNames.lock);
        this.isLocked = false;
        this.tick();
    }

    /**
     * @description Добавляет обработчик события скрола на eventContainer
     * @param eventHandler {function} - Стандартная функция обработчик события скрола
     */
    public addScrollListener = (eventHandler: EventHandler) => {
        this.eventContainer.addEventListener('scroll', eventHandler)
        this.listeners.add(eventHandler)
    }

    /**
     * @description Удаляет существующий обработчик события скрола на eventContainer
     * @param eventHandler {function} - Стандартная функция обработчик события скрола
     */
    public removeScrollListener = (eventHandler: EventHandler) => {
        this.eventContainer.removeEventListener('scroll', eventHandler)
        this.listeners.delete(eventHandler);
    }

    /**
     * @description Очистка событий, таймеров, классов и атрибутов
     */
    public destroy = () => {
        if (this.syncTo) clearTimeout(this.syncTo);
        (<HTMLElement>this.scrollContainer).style.removeProperty('overflow');
        this.scrollContainer.classList.remove(...Object.values(this.classNames));
        this.scrollContainer.removeAttribute('data-scroll-direction');

        window.removeEventListener("keydown", this.onKeyDown);
        this.eventContainer.removeEventListener("scroll", this.onScroll);
        this.eventContainer.removeEventListener("wheel", this.onWheel);
        Array.from(this.listeners.values()).forEach((listener) => this.removeScrollListener(listener));
    }

    private findElementBySelector = (selector: ElementOrSelector | null | undefined) => {
        if (selector !== window && selector !== document.scrollingElement) {
            return typeof selector === "string" ? document.querySelector<HTMLElement>(selector) : <HTMLElement>selector;
        } else {
            return <HTMLElement>document.scrollingElement ?? document.body;
        }
    }

    private init = () => {
        (<HTMLElement>this.scrollContainer).style.overflow = 'auto';
        this.scrollContainer.classList.add(this.classNames.container);

        this.initEvents();
        this.findInitialAnchor();
    }

    private initEvents = () => {
        window.addEventListener("keydown", this.onKeyDown, { passive: true });
        this.eventContainer.addEventListener("scroll", this.onScroll, { passive: true });
        this.eventContainer.addEventListener("wheel", this.onWheel, { passive: false });
    }

    private findInitialAnchor = () => {
        if (window.location.hash) {
            const anchor = document.querySelector<HTMLElement>(window.location.hash);

            if (anchor) {
                requestAnimationFrame(() => this.setValue(anchor.offsetTop))
            }
        } else {
            this.setValue(0);
        }
    }

    private onScroll = () => {
        if (this.isLocked) return;

        this.updateDirection();

        if (window.location.hash !== this.lastHash) {
            this.lastHash = window.location.hash;
            return void this.syncPos();
        }

        if (Math.abs(this.scrollY - this.easedY) > window.innerHeight * 0.5) {
            this.checkSyncTo();
        }
    }

    private onKeyDown = (e: KeyboardEvent) => {
        if (this.isLocked || !~this.navKeys.indexOf(e.key)) return;

        this.syncPos();
    }

    private onWheel = (e: Event) => {
        e.preventDefault();

        this.manageParentScrollbars(<HTMLElement>e.target);

        if (this.isLocked) return;

        this.targetY += this.wheelCalculate(<WheelEvent>e).pixelY;
        this.targetY = Math.min(this.targetY, this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight);
        this.targetY = Math.max(this.targetY, 0);

        if (this.rafID === null) {
            this.tick();
        }
    }

    private syncPos = () => {
        this.easedY = this.scrollContainer.scrollTop;
        this.targetY = this.scrollContainer.scrollTop;
        this.lastY = this.scrollContainer.scrollTop;
    }

    private checkSyncTo = () => {
        if (this.syncTo) clearTimeout(this.syncTo);
        this.syncTo = setTimeout(this.syncPos, 200);
    }

    private wheelCalculate = (wheelEvent: WheelEvent) => {
        let deltaY = wheelEvent.deltaY;
        let deltaX = wheelEvent.deltaX;

        if (wheelEvent.deltaMode) {
            const deltaMultiply = wheelEvent.deltaMode == 1 ? 40 : 800;
            deltaX *= deltaMultiply;
            deltaY *= deltaMultiply;
        }

        return {
            spinX: deltaX < 1 ? -1 : 1,
            spinY: deltaY < 1 ? -1 : 1,
            pixelX: deltaX,
            pixelY: deltaY
        }
    }

    private manageParentScrollbars = (currentTarget: HTMLElement) => {
        if (currentTarget.closest(`.${this.classNames.container}`) !== this.scrollContainer) {
            !this.isLocked && this.lock();
        } else  {
            this.isLocked && this.unlock();
        }
    }

    private tick = () => {
        this.easedY = +((1 - this.damping) * this.easedY + this.damping * this.targetY).toFixed(2);
        this.scrollContainer.scrollTop = Math.round(this.easedY);

        if (this.lastY === this.easedY) {
            return this.rafID = null;
        }

        this.lastY = this.easedY;
        this.velocity = parseInt((this.targetY - this.easedY).toString());
        this.progress = Math.round(this.easedY / (this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight) * 100)
        this.rafID = requestAnimationFrame(this.tick);
    }
}

export default OnlyScroll