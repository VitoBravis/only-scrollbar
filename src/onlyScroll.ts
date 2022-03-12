type ElementOrSelector = HTMLHtmlElement | Element | Window | string;
/** TODO: Пока не используется, планируется редактируемость кривой Безье */
type Easing = 'default';
type ClassNames = { [key in string]: string }

export interface OnlyScrollOptions {
    /** @description Сила инерции в формате числа от 0 до 1 */
    dumping?: number;
    /** @description Контейнер, на который будут применяться события скрола */
    eventContainer?: ElementOrSelector | Window;
    easing?: Easing;
    isSmooth?: boolean;
}

const defaultOptions = {
    dumping: 1,
    easing: "default",
    isSmooth: true
}

abstract class OnlyInstance {
    public classNames: ClassNames = {
        container: 'only-scroll-container',
        lock: 'only-scroll--is-locked',
    };

    private readonly dumping: number;
    private syncTo: NodeJS.Timeout | undefined;
    private isContinuous: boolean;
    private continuousTimeout: NodeJS.Timeout | undefined;
    private rafID: number | null;
    private easedY: number;
    private lastY: number;
    private navKeys: number[];
    private targetY: number;

    protected scrollY: number;

    public scrollContainer: HTMLElement;
    public eventContainer: Element | Window;
    public velocity: number;
    public progress: number;
    public lastHash: string;
    public isLocked: boolean;

    constructor(element: ElementOrSelector | null | undefined, options?: OnlyScrollOptions) {
        const container =  this.findElementBySelector(element);

        if (!container) throw new Error('scrollElement does not exist');
        this.scrollContainer = container;

        this.eventContainer = this.findElementBySelector(options?.eventContainer) ?? this.scrollContainer;

        this.scrollY = 0;
        this.easedY = 0;
        this.targetY = 0;
        this.lastY = 0;
        this.velocity = 0;
        this.progress = 0;

        this.dumping = (options?.dumping ?? defaultOptions.dumping) * 0.1;

        this.lastHash = window.location.hash;
        this.isLocked = false;
        this.rafID = null
        this.isContinuous = false;

        //TODO: Устарело, надо заменить
        this.navKeys = [9, 32, 33, 34, 35, 36, 38, 40];
    }

    private findElementBySelector = (selector: ElementOrSelector | null | undefined) => {
        if (selector !== window && selector !== document.scrollingElement) {
            return typeof selector === "string" ? document.querySelector<HTMLElement>(selector) : <HTMLElement>selector;
        } else {
            return <HTMLElement>document.scrollingElement ?? document.body;
        }
    }

    protected init() {
        (<HTMLElement>this.scrollContainer).style.overflow = 'auto';
        this.scrollContainer.classList.add(this.classNames.container);

        window.addEventListener("keyup", this.onKeyUp);
        window.addEventListener("scroll", this.scrollHandler);

        // TODO: В текущем виде не работает в IE11
        this.eventContainer.addEventListener("wheel", this.onWheel, {
            passive: false
        });
    }

    private scrollHandler = () => {
        if (this.isLocked) return;

        if (this.scrollContainer) {
            this.scrollY = this.scrollContainer.scrollTop;
        }

        if (window.location.hash !== this.lastHash) {
            this.lastHash = window.location.hash;
            return void this.syncPos();
        }

        /*
        *  Проверка на наличие инерции
        *  В обычных случаях событие скролла не позволит прервать работу функции tick
        *  Скролл по инерции считается, если позиция скрола изменяется без участия события scroll на протяжении 50ms
        *  TODO: Надо придумать что-то получше, это решение выглядит неэффективно
        */
        if (this.continuousTimeout) {
            clearTimeout(this.continuousTimeout);
        }
        this.continuousTimeout = setTimeout(() => this.isContinuous = true, 50)

        if (this.isContinuous) {
            this.syncPos();
            this.isContinuous = false;
        }
        /* --- */

        if (Math.abs(this.scrollY - this.easedY) > window.innerHeight * 0.5) {
            if (this.syncTo) {
                clearTimeout(this.syncTo);
            }
            this.syncTo = setTimeout(this.syncPos, 200);
        }
    }

    private onKeyUp = (e: KeyboardEvent) => {
        //TODO: keyCode - устаревшее поле, надо переписать на поле code
        if (this.isLocked || this.navKeys.indexOf(e.keyCode) > -1) {
            if (this.syncTo) {
                clearTimeout(this.syncTo);
            }
            this.syncTo = setTimeout(this.syncPos, 200);
        }
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

    private onWheel = (e: Event) => {
        e.preventDefault();

        /* Проверка на вложенные скрол-контейнеры */
        if ((<HTMLElement>e.target).closest(`.${this.classNames.container}`) !== this.eventContainer) {
            if (!this.isLocked) {
                this.lock();
            }
        } else if (this.isLocked) {
            this.unlock();
        }
        /* --- */

        if (this.isLocked) return;

        this.targetY += this.wheelCalculate(<WheelEvent>e).pixelY;
        this.targetY = Math.min(this.targetY, this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight);
        this.targetY = Math.max(this.targetY, 0);

        if (this.rafID === null) {
            this.tick();
        }
    }

    private tick = () => {
        if (this.isLocked) return;

        // Формула для вычисления изинга, надо вынести в отдельный хелпер и сделать более понятной
        // TODO: Проверить Math.round, возможно, округление не нужно
        this.easedY = Math.round((1 - this.dumping) * this.easedY + this.dumping * this.targetY);

        // TODO: Вызывает ошибку в вычислениях. Надо доработать
        //  Работает и без этой формулы, но шаг изменения значений становится слишком маленьким по мере приближения к targetY.
        // this.easedY = (100 * (this.easedY + 1) | 0) / 100;

        this.scrollContainer.scrollTop = this.easedY;

        if (this.lastY === this.easedY) {
            if (this.continuousTimeout) {
                clearTimeout(this.continuousTimeout);
            }
            this.isContinuous = false;
            return this.rafID = null;
        }

        this.lastY = this.easedY;

        /** TODO: progress & velocity можно использовать, но их вычисления надо доработать */
        this.velocity = parseInt((this.targetY - this.easedY).toString());
        this.progress = this.easedY / (this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight)
        this.progress = (10 * (this.progress + .01) | 0) / 10;
        /* --- */

        this.rafID = requestAnimationFrame(this.tick);
    }

    private resync = () => {
        this.syncPos();
        this.rafID = null
    }

    public syncPos = () => {
        if (this.isLocked) return;

        this.easedY = this.scrollContainer.scrollTop;
        this.targetY = this.scrollContainer.scrollTop;
        this.lastY = this.scrollContainer.scrollTop;
    }

    protected scrollTo(positionY: number) {
        this.targetY = positionY;
        this.tick();
    }

    protected setPosition(positionY: number) {
        this.scrollContainer.scrollTop = positionY;
        this.resync()
    }

    protected lock() {
        this.isLocked = true;
    }

    protected unlock() {
        this.isLocked = false;
        this.tick();
    }
}

class OnlyScroll extends OnlyInstance {
    private position: number;
    private lastPosition: number;
    private lastDirection: null | 1 | -1;

    public isSmooth: boolean;

    constructor(element: ElementOrSelector | null | undefined, options?: OnlyScrollOptions) {
        super(element, options)
        this.isSmooth = options?.isSmooth ?? defaultOptions.isSmooth;

        this.position = 0;
        this.lastPosition = 0;
        this.lastDirection = null;

        this.init();
    }

    public get direction(): 1 | -1 {
        return this.position > this.lastPosition ? 1 : -1
    }

    public get y(): number {
        return this.isSmooth ? this.scrollY : this.position;
    }

    protected init = () => {
        if (this.isSmooth) {
            super.init()
        }

        this.eventContainer.addEventListener("scroll", this.onScroll, {
            passive: true
        })
        if ("scrollRestoration" in history) {
            history.scrollRestoration = "manual";
        }

        if (window.location.hash) {
            const anchor = document.querySelector<HTMLElement>(window.location.hash);

            if (anchor) {
                requestAnimationFrame(() => {
                    this.setValue(anchor.offsetTop);
                })
            }
        } else {
            this.setValue(0);
        }
    }

    private onScroll = () => {
        this.lastPosition = this.position;

        this.position = this.scrollContainer.scrollTop;

        if (this.direction !== this.lastDirection) {
            this.scrollContainer.dataset.scrollDirection = this.direction === 1 ? "down" : "up";
            this.lastDirection = this.direction;
        }
    }

    public scrollTo = (positionY: number) => {
        this.isSmooth ? super.scrollTo(positionY) : this.setValue(positionY)
    }

    public setValue = (value: number) => {
        this.isSmooth ? super.setPosition(value) : this.scrollContainer.scrollTop = value
    }

    lock = () => {
        this.scrollContainer?.classList.add(this.classNames.lock);
        this.isSmooth && super.lock();
        this.isLocked = true
    }

    public unlock = () => {
        this.scrollContainer.classList.remove(this.classNames.lock);
        this.isSmooth && super.unlock();
        this.isLocked = false
    }
}

export default OnlyScroll