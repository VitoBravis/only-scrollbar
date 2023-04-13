type ElementOrSelector = HTMLHtmlElement | Element | Window | string;
type Easing = 'default';
type ClassNamesKeys = 'container' | 'lock';
type ClassNames = Record<ClassNamesKeys, string>;
/**
 * @description Направление скрола
 * @description 1 = Up, -1 = Down
 */
export type Direction = Record<keyof Delta2D, -1 | 1>
/**
 * @description Функция-обработчик для события скрола
 */
export type EventHandler = (e: Event) => void;

export type OnlyScrollEvents = 'scrollEnd' | 'changeDirectionY' | 'changeDirectionX'

export type OnlyScrollModes = 'vertical' | 'horizontal' | 'free';

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
    /**
     * @description Доступные направления скрола
     */
    mode?: OnlyScrollModes
}

export interface Delta2D {
    x: number;
    y: number;
}

const isIosDevice =
    typeof window !== 'undefined' &&
    window.navigator &&
    window.navigator.platform &&
    (/iP(ad|hone|od)/.test(window.navigator.platform) ||
        (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1));

const preventDefault: EventListener = (event: Event) => {
    if ((<TouchEvent>event).touches.length > 1) return;
    if (event.preventDefault) event.preventDefault();
}

/**
 * @description Набор настроек скрола по умолчанию
 */
const defaultOptions: Required<Omit<OnlyScrollOptions, 'eventContainer'>> = {
    damping: 1,
    easing: "default",
    mode: "vertical"
}

const emit = (container: OnlyScroll["eventContainer"], eventName: OnlyScrollEvents) => {
    const event = new CustomEvent(eventName);
    container.dispatchEvent(event)
}

/**
 * @todo Перенести в helpers
 * @param wheelEvent
 */
function wheelCalculate(wheelEvent: WheelEvent) {
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

const wheelFunctions: Record<OnlyScrollModes, EventListener> = {
    vertical: function(this: OnlyScroll, e: Event) {
        const { pixelY } = wheelCalculate(<WheelEvent>e);
        this.targetPosition.y = Math.max(Math.min( this.targetPosition.y + pixelY, this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight), 0);
    },
    horizontal: function(this: OnlyScroll, e: Event) {
        const { pixelX } = wheelCalculate(<WheelEvent>e);
        this.targetPosition.x = Math.max(Math.min( this.targetPosition.x + pixelX, this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth), 0);
    },
    free: function(this: OnlyScroll, e: Event) {
        const { pixelX, pixelY } = wheelCalculate(<WheelEvent>e);
        this.targetPosition = {
            x: Math.max(Math.min( this.targetPosition.x + pixelX, this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth), 0),
            y: Math.max(Math.min( this.targetPosition.y + pixelY, this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight), 0)
        };
    }
}

const tickByMode: Record<OnlyScrollModes, FrameRequestCallback> = {
    vertical: function(this: OnlyScroll) {
        this.easedPosition = {
            x: 0,
            y: +((1 - this.damping) * this.easedPosition.y + this.damping * this.targetPosition.y).toFixed(2)
        }
        this.scrollContainer.scrollTop = Math.round(this.easedPosition.y);

        if (this.lastPosition.y === this.easedPosition.y) {
            this.rafID = null;
            return;
        }

        this.lastPosition = this.easedPosition;
        this.velocity = {
            x: 0,
            y: Math.round(this.targetPosition.y - this.easedPosition.y)
        };
        this.progress = {
            x: 0,
            y: Math.round(this.easedPosition.y / (this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight) * 100)
        }
        this.rafID = requestAnimationFrame(this.tick);
    },
    horizontal: function(this: OnlyScroll) {
        this.easedPosition = {
            x: +((1 - this.damping) * this.easedPosition.x + this.damping * this.targetPosition.x).toFixed(2),
            y: 0
        }
        this.scrollContainer.scrollLeft = Math.round(this.easedPosition.x);

        if (this.lastPosition.x === this.easedPosition.x) {
            this.rafID = null;
            return;
        }

        this.lastPosition = this.easedPosition;
        this.velocity = {
            x: Math.round(this.targetPosition.x - this.easedPosition.x),
            y: 0
        };
        this.progress = {
            x: Math.round(this.easedPosition.x / (this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth) * 100),
            y: 0
        }
        this.rafID = requestAnimationFrame(this.tick);
    },
    free: function(this: OnlyScroll) {
        this.easedPosition = {
            x: +((1 - this.damping) * this.easedPosition.x + this.damping * this.targetPosition.x).toFixed(2),
            y: +((1 - this.damping) * this.easedPosition.y + this.damping * this.targetPosition.y).toFixed(2)
        }
        this.scrollContainer.scrollTop = Math.round(this.easedPosition.y);
        this.scrollContainer.scrollLeft = Math.round(this.easedPosition.x);

        if (this.lastPosition.y === this.easedPosition.y && this.lastPosition.x === this.easedPosition.x) {
            this.rafID = null;
            return;
        }

        this.lastPosition = this.easedPosition;
        this.velocity = {
            x: Math.round(this.targetPosition.x - this.easedPosition.x),
            y: Math.round(this.targetPosition.y - this.easedPosition.y)
        };
        this.progress = {
            x: Math.round(this.easedPosition.x / (this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth) * 100),
            y: Math.round(this.easedPosition.y / (this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight) * 100)
        }
        this.rafID = requestAnimationFrame(this.tick);
    },
}


/**
 * @description Модификация нативного скрола, работающая по принципу перерасчета текущей позиции с помощью Безье функции.
 * @description Пока не работает на старых браузеров, которые не поддерживают пассивные события
 * @class
 * @version 1.0.0
 */
class OnlyScroll {
    /**
     * @description Объект со всеми css-классами, которые используются в скроле
     */
    static readonly classNames: ClassNames = {
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
    public velocity: Delta2D;
    /**
     * @description Текущий прогресс скрола, в числовом представлении от 0 до 100
     */
    public progress: Delta2D;
    /**
     * @description Состояние, отображающее блокировку скрола
     */
    public isLocked: boolean;

    public position: Delta2D;

    public targetPosition: Delta2D;
    public easedPosition: Delta2D;
    public lastPosition: Delta2D;

    public readonly mode: OnlyScrollModes;

    public readonly damping: number;
    private syncTo: NodeJS.Timeout | undefined;
    public rafID: number | null;
    private lastDirection: Direction | null;
    private lastHash: string;

    private isDisable: boolean;

    private previousBodyPosition: any;
    private initialClientY: number;
    private documentListenerAdded: boolean;

    private readonly setTargetPosition: EventListener;
    public readonly tick: FrameRequestCallback;

    constructor(element: ElementOrSelector | null | undefined, options?: OnlyScrollOptions) {
        const _scrollContainer =  this.findElementBySelector(element);

        if (!_scrollContainer) throw new Error('scrollElement does not exist');

        this.scrollContainer = _scrollContainer;

        const _eventContainer = this.findElementBySelector(options?.eventContainer) ?? this.scrollContainer;
        this.eventContainer = _eventContainer === document.scrollingElement ? window : _eventContainer;

        this.position = { x: 0, y: 0 };
        this.targetPosition = { x: 0, y: 0 }
        this.easedPosition = { x: 0, y: 0 }
        this.lastPosition = { x: 0, y: 0 }
        this.velocity = { x: 0, y: 0 };
        this.progress = { x: 0, y: 0 };
        this.lastDirection = null;
        this.isLocked = false;
        this.rafID = null
        this.damping = (options?.damping ?? defaultOptions.damping) * 0.1;
        this.mode = options?.mode ?? defaultOptions.mode;
        this.lastHash = window.location.hash;
        this.isDisable = false;

        this.initialClientY = -1;
        this.documentListenerAdded = false;

        this.setTargetPosition = wheelFunctions[this.mode].bind(this);
        this.tick = tickByMode[this.mode].bind(this);

        this.init();
    }

    /**
     * @description Последнее направление скрола в числовом представлении
     * @description 1 = Down|Right, -1 = Up|Left
     */
    public get direction(): Direction {
        const Y = Math.sign(this.position.y - this.lastPosition.y);
        const X = Math.sign(this.position.x - this.lastPosition.x);
        return {
            y: Y !== 0 ? <-1 | 1>Y : this.lastDirection?.y ?? -1,
            x: X !== 0 ? <-1 | 1>X : this.lastDirection?.x ?? -1
        }
    }

    /**
     * @description Обновление направления скрола. Также устанавливает на scrollContainer атрибут data-scroll-direction со значениями "up" | "down"
     * @description Вызывается автоматически на скрол, но можно вызывать вручную на случай непредвиденных ошибок
     */
    public updateDirection = () => {
        this.lastPosition = this.position
        this.position = {
            x: Math.abs(this.scrollContainer.scrollLeft),
            y: Math.abs(this.scrollContainer.scrollTop)
        }
        const {x, y} = this.direction;
        if (x !== this.lastDirection?.x) {
            this.scrollContainer.dataset.scrollDirectionX = x !== 1 ? "left" : "right";
            emit(this.eventContainer, "changeDirectionX")
        }
        if (y !== this.lastDirection?.y) {
            this.scrollContainer.dataset.scrollDirectionY = y !== 1 ? "up" : "down";
            emit(this.eventContainer, "changeDirectionY")
        }
        this.lastDirection = {x, y};
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
    public scrollTo = ({ x, y }: Partial<Delta2D>) => {
        if (y === this.position.y && x === this.position.x) return;

        this.sync();
        this.targetPosition = {
            x: x ?? this.position.x,
            y: y ?? this.position.y
        }
        this.rafID = requestAnimationFrame(this.tick);
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
        if (this.isLocked) return;

        if (isIosDevice) {
            this.disableIosScroll();
        } else {
            this.scrollContainer.style.overflow = 'hidden';
        }

        this.scrollContainer.classList.add(OnlyScroll.classNames.lock);
        this.removeEventListener("wheel", this.onWheel);
        this.isLocked = true
        this.sync();
    }

    /**
     * @description Разблокирует скрол, запускает перерасчет позиции скрола
     */
    public unlock = () => {
        if (!this.isLocked) return;

        if (isIosDevice) {
            this.enableIosScroll();
        } else {
            this.scrollContainer.style.overflow = 'auto';
        }

        this.scrollContainer.classList.remove(OnlyScroll.classNames.lock);
        this.addEventListener("wheel", this.onWheel, { passive: false });
        this.isLocked = false;
        if (this.rafID === null) {
            this.rafID = requestAnimationFrame(this.tick);
        }
    }

    public addEventListener = (type: OnlyScrollEvents | keyof HTMLElementEventMap, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions) => {
        this.eventContainer.addEventListener(type, listener, options)
    }

    public removeEventListener = (type: OnlyScrollEvents | keyof HTMLElementEventMap, listener: EventListenerOrEventListenerObject) => {
        this.eventContainer.removeEventListener(type, listener)
    }

    /**
     * @description Очистка событий, таймеров, классов и атрибутов
     */
    public destroy = () => {
        if (this.syncTo) clearTimeout(this.syncTo);
        this.rafID = null;
        (<HTMLElement>this.scrollContainer).style.removeProperty('overflow');
        this.scrollContainer.classList.remove(...Object.values(OnlyScroll.classNames));
        this.scrollContainer.removeAttribute('data-scroll-direction-x');
        this.scrollContainer.removeAttribute('data-scroll-direction-y');

        const scrollingElement = this.scrollContainer === document.documentElement ? window : this.scrollContainer;
        scrollingElement.removeEventListener("scroll", this.onScroll);
        this.eventContainer.removeEventListener("wheel", this.onWheel);
    }

    /**
     * @todo Перенести в helpers
     * @param selector
     */
    private findElementBySelector = (selector: ElementOrSelector | null | undefined) => {
        if (selector !== window && selector !== document.scrollingElement) {
            return typeof selector === "string" ? document.querySelector<HTMLElement>(selector) : <HTMLElement>selector;
        } else {
            return <HTMLElement>document.scrollingElement ?? document.body;
        }
    }

    private init = () => {
        this.scrollContainer.style.overflow = 'auto';
        this.scrollContainer.style.scrollBehavior = 'auto';
        this.scrollContainer.dataset.scrollDirectionY = 'up'
        this.scrollContainer.dataset.scrollDirectionX = 'left'
        this.scrollContainer.classList.add(OnlyScroll.classNames.container);

        this.initEvents();
        this.findInitialAnchor();
    }

    private initEvents = () => {
        const scrollingElement = this.scrollContainer === document.documentElement ? window : this.scrollContainer;
        scrollingElement.addEventListener("scroll", this.onScroll, { passive: true });
        this.addEventListener("wheel", this.onWheel, { passive: false });
    }

    private findInitialAnchor = () => {
        if (!window.location.hash) return;

        const anchor = document.querySelector<HTMLElement>(window.location.hash);

        if (anchor) {
            requestAnimationFrame(() => this.setValue(anchor.offsetTop))
        }
    }

    private onScroll = () => {
        if (this.isLocked || this.isDisable) return;

        this.updateDirection();

        if (window.location.hash !== this.lastHash) {
            this.lastHash = window.location.hash;
            this.syncPos();
            return;
        }

        this.checkSyncTo();
    }

    private onWheel = (e: Event) => {
        if ((<WheelEvent>e).ctrlKey) return;

        e.preventDefault();

        if (this.isLocked) return;

        this.manageParentScrollbars(<HTMLElement>e.target);

        if (this.isDisable) return;

        this.setTargetPosition(e);

        if (this.rafID === null) {
            this.rafID = requestAnimationFrame(this.tick);
        }
    }

    private syncPos = () => {
        const currentPosition = { y: this.scrollContainer.scrollTop, x: this.scrollContainer.scrollLeft }
        this.easedPosition = currentPosition;
        this.targetPosition = currentPosition;
        this.lastPosition = currentPosition;
        this.position = currentPosition;
    }

    private checkSyncTo = () => {
        if (this.syncTo) clearTimeout(this.syncTo);
        this.syncTo = setTimeout(() => {
            emit(this.eventContainer, "scrollEnd");
            this.sync();
        }, 200);
    }

    private manageParentScrollbars = (currentTarget: HTMLElement) => {
        if (currentTarget.closest(`.${OnlyScroll.classNames.container}`)?.isSameNode(this.scrollContainer)) {
            this.isDisable && this.enable();
        } else  {
            !this.isDisable && this.disable();
        }
    }

    private disable = () => {
        this.isDisable = true;
        this.sync();
    }

    private enable = () => {
        this.isDisable = false;
        this.sync();
    }

    private disableIosScroll = () => {
        requestAnimationFrame(() => {
            if (this.previousBodyPosition === undefined) {
                this.previousBodyPosition = {
                    position: document.body.style.position,
                    top: document.body.style.top,
                    left: document.body.style.left
                };

                // Update the dom inside an animation frame
                const {scrollY, scrollX, innerHeight} = window;
                document.body.style.position = 'fixed';
                document.body.style.top = `${-scrollY}px`;
                document.body.style.left = `${-scrollX}px`;

                setTimeout(() => window.requestAnimationFrame(() => {
                    // Attempt to check if the bottom bar appeared due to the position change
                    const bottomBarHeight = innerHeight - window.innerHeight;
                    if (bottomBarHeight && scrollY >= innerHeight) {
                        // Move the content further up so that the bottom bar doesn't hide it
                        document.body.style.top = -(scrollY + bottomBarHeight) + 'px';
                    }
                }), 300)
            }
        })

        this.scrollContainer.ontouchstart = (event: TouchEvent) => {
            if (event.targetTouches.length === 1) {
                this.initialClientY = event.targetTouches[0].clientY;
            }
        };
        this.scrollContainer.ontouchmove = (event: TouchEvent) => {
            if (event.targetTouches.length === 1) {
                const clientY = event.targetTouches[0].clientY - this.initialClientY;

                if (this.scrollContainer && this.scrollContainer.scrollTop === 0 && clientY > 0) {
                    preventDefault(event);
                }

                if (this.scrollContainer.scrollHeight - this.scrollContainer.scrollTop <= this.scrollContainer.clientHeight && clientY < 0) {
                    preventDefault(event);
                }

                event.stopPropagation();
                return;
            }
        };

        if (!this.documentListenerAdded) {
            document.addEventListener('touchmove', preventDefault, { passive: false });
            this.documentListenerAdded = true;
        }
    }

    private enableIosScroll = () => {
        this.scrollContainer.ontouchstart = null;
        this.scrollContainer.ontouchmove = null;

        if (this.documentListenerAdded) {
            document.removeEventListener('touchmove', preventDefault);
            this.documentListenerAdded = false;
        }

        if (this.previousBodyPosition !== undefined) {
            const y = -parseInt(document.body.style.top, 10);
            const x = -parseInt(document.body.style.left, 10);

            document.body.style.position = this.previousBodyPosition.position;
            document.body.style.top = this.previousBodyPosition.top;
            document.body.style.left = this.previousBodyPosition.left;

            window.scrollTo(x, y);

            this.previousBodyPosition = undefined;
        }
    }
}

export default OnlyScroll