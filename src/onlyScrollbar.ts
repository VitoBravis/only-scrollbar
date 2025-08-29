import {emit, findElementBySelector, getFieldsByAxis} from "./utils/utils";
import {DEFAULT_OPTIONS, IS_TOUCH_DEVICE, MARGIN_ERROR} from "./utils/const";
import {
    Attributes,
    ClassNames,
    Direction,
    ElementOrSelector,
    InternalFields,
    OnlyScrollbarEvents,
    OnlyScrollbarOptions
} from "./types";


class OnlyScrollbar {
    /**
     * @description Объект со всеми css-классами, которые используются в скроле
     */
    static ClassNames: ClassNames = {
        container: 'os-container',
        lock: 'os-container--locked',
        scrolling: 'os-container--scrolling'
    };
    static Attributes: Attributes = {
        anchor: 'data-os-anchor',
        anchorId: 'data-os-anchor-id',
        direction: 'data-os-direction'
    };
    static Events = {
        start: "os:start",
        stop: "os:stop",
        change: 'os:change',
        reachEnd: 'os:reachEnd',
        reachStart: 'os:reachStart',
        lock: 'os:lock',
        unlock: 'os:unlock'
    } as const
    /**
     * @description HTML-элемент, который будет являться контейнером для скрола
     * @description Для корректной работы размеры контейнера должны быть ограничены
     */
    public readonly scrollContainer: HTMLElement;
    /**
     * @description HTML-элемент, на который будут применяться все события
     * @default OnlyScrollbar.scrollContainer
     */
    public readonly eventContainer: HTMLElement | Window;
    public readonly options: Required<OnlyScrollbarOptions>;
    /**
     * @description Состояние, отображающее блокировку скрола
     */
    public isLocked: boolean;
    public position: number;
    public isStart: boolean;
    public isEnd: boolean;
    public isScrolling: boolean;
    private targetPosition: number;
    private prevTickTime: number;
    private lastPosition: number;
    private syncTo?: NodeJS.Timeout;
    private rafID: number | null;
    private lastDirection: Direction | null;
    private fields: InternalFields;

    constructor(element: ElementOrSelector | null | undefined, options: OnlyScrollbarOptions = DEFAULT_OPTIONS) {
        const _scrollContainer = findElementBySelector(element);

        if (!_scrollContainer) throw new Error('scrollElement does not exist');

        this.scrollContainer = _scrollContainer;

        const _eventContainer = findElementBySelector(options?.eventContainer) ?? this.scrollContainer;
        this.eventContainer = _eventContainer === document.scrollingElement ? window : _eventContainer;

        this.position = 0;
        this.targetPosition = 0;
        this.lastPosition = 0;
        this.prevTickTime = 0;
        this.lastDirection = null;
        this.isLocked = false;
        this.isEnd = false;
        this.isStart = true;
        this.isScrolling = false;
        this.rafID = null
        this.options = {
            anchors: {...DEFAULT_OPTIONS.anchors, ...{root: this.scrollContainer}, ...(options.anchors ?? {})},
            speed: options?.speed ?? DEFAULT_OPTIONS.speed,
            eventContainer: this.eventContainer,
            axis: options?.axis ?? DEFAULT_OPTIONS.axis,
            listenAxis: options?.listenAxis ?? options?.axis ?? DEFAULT_OPTIONS.listenAxis,
            damping: (options?.damping ?? DEFAULT_OPTIONS.damping) * 0.1
        }
        this.fields = getFieldsByAxis(this.options.axis, this.options.listenAxis);

        this.stop = this.stop.bind(this);

        this.init();
    }
    /**
     * @description Последнее направление скрола в числовом представлении
     * @description 1 = Forward, -1 = Back
     */
    public get direction(): Direction {
        return <Direction>(Math.sign(this.position - this.lastPosition) || this.lastDirection || -1);
    }

    /**
     * Остановка анимации скрола на текущей позиции
     */
    public stop(): void {
        this.sync();
        if (this.syncTo) {
            clearTimeout(this.syncTo);
        }
        if (typeof this.rafID === "number") {
            cancelAnimationFrame(this.rafID);
            this.rafID = null;
        }
        this.isScrolling = false;
        this.scrollContainer.classList.remove(OnlyScrollbar.ClassNames.scrolling);
        emit(this.eventContainer, OnlyScrollbar.Events.stop);
        this.checkEdges();
    }

    /**
     * @description Плавный скрол до конкретной позиции, с применением стандартных расчетов для вычисления промежуточных значений
     * @param position
     */
    public scrollTo(position: number): void {
        if (position === this.position) return;
        this.stop();

        if (IS_TOUCH_DEVICE) {
            this.scrollContainer.scrollTo({
                [this.fields.offset]: position,
                behavior: "smooth"
            });
            return;
        }

        this.targetPosition = position;
        requestAnimationFrame(this.onFirstTick);
    }

    public scrollIntoView(element: HTMLElement, offset: number = 0): void {
        const targetPosition = this.position + element.getBoundingClientRect()[this.fields.offset] - offset;
        this.scrollTo(targetPosition);
    }

    /**
     * @description Установка конкретного значения скрол позиции, без применения каких-либо анимаций
     * @param value {number} - Числовое значение целевой позиции скрола
     */
    public setValue(value: number): void {
        this.scrollContainer[this.fields.scrollOffset] = value;
    }

    /**
     * @description Блокирует скрол
     * @description Блокировка также прервет запущенные процессы по перерасчету позиции
     */
    public lock(): void {
        if (this.isLocked) return;

        this.scrollContainer.style.overflow = 'hidden';
        this.scrollContainer.classList.add(OnlyScrollbar.ClassNames.lock);
        this.removeEventListener("wheel", this.onWheel);
        this.isLocked = true;
        this.stop();
    }

    /**
     * @description Разблокирует скрол, запускает перерасчет позиции скрола
     */
    public unlock(): void {
        if (!this.isLocked) return;

        this.scrollContainer.style.overflow = 'auto';
        this.scrollContainer.classList.remove(OnlyScrollbar.ClassNames.lock);
        this.addEventListener("wheel", this.onWheel, { passive: false });
        this.isLocked = false;
        if (this.rafID === null) {
            requestAnimationFrame(this.onFirstTick);
        }
    }

    public addEventListener(type: OnlyScrollbarEvents | keyof HTMLElementEventMap, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void {
        this.eventContainer.addEventListener(type, listener, options);
    }

    public removeEventListener(type: OnlyScrollbarEvents | keyof HTMLElementEventMap, listener: EventListenerOrEventListenerObject): void {
        this.eventContainer.removeEventListener(type, listener);
    }

    public destroy(): void {
        this.unlock();
        if (this.syncTo) clearTimeout(this.syncTo);
        this.rafID = null;
        this.scrollContainer.style.removeProperty('overflow');
        this.scrollContainer.classList.remove(...Object.values(OnlyScrollbar.ClassNames));
        this.scrollContainer.removeAttribute(OnlyScrollbar.Attributes.direction);

        const scrollingElement = this.scrollContainer === document.documentElement ? window : this.scrollContainer;
        scrollingElement.removeEventListener("scroll", this.onScroll);
        this.eventContainer.removeEventListener("wheel", this.onWheel);
    }

    private init(): void {
        this.scrollContainer.style.overflow = 'auto';
        this.scrollContainer.style.scrollBehavior = 'auto';
        this.scrollContainer.setAttribute(OnlyScrollbar.Attributes.direction, 'back');
        this.sync();

        this.initEvents();
    }

    /** @todo: Проверить. В логике были ошибки, если передать eventContainer */
    private initEvents(): void {
        const scrollingElement = this.scrollContainer === document.documentElement ? window : this.scrollContainer;
        scrollingElement.addEventListener("scroll", this.onScroll, { passive: true });
        this.addEventListener("wheel", this.onWheel, { passive: false });
        if (this.options.anchors.active) {
            const clickHandler = (this.options.anchors.type === 'native') ? this.handleNativeAnchors : this.handleCustomAnchors;
            this.options.anchors.root!.addEventListener("click", clickHandler);
        }
    }

    private handleCustomAnchors = (e: Event) => {
        const target = <HTMLElement>e.target;
        const targetElement = target.closest(`[${OnlyScrollbar.Attributes.anchor}]`);
        if (!targetElement) {
            return;
        }

        const targetId = targetElement.getAttribute(OnlyScrollbar.Attributes.anchor);
        const selector = `[${OnlyScrollbar.Attributes.anchorId}="${targetId}"]`;
        const targetAnchor = this.options.anchors.root!.querySelector<HTMLElement>(selector);
        if (!targetAnchor) {
            return;
        }

        e.preventDefault();
        if (this.options.anchors.stopPropagation) {
            e.stopPropagation();
        }

        this.scrollIntoView(targetAnchor, this.options.anchors.offset);
    }

    private handleNativeAnchors = (e: Event): void => {
        this.stop();
        const target = <HTMLElement>e.target;
        if (!(target instanceof HTMLAnchorElement)) {
            return;
        }

        const targetAnchor = document.getElementById(target.hash.substring(1));
        if (!targetAnchor) {
            return;
        }

        e.preventDefault();
        if (this.options.anchors.stopPropagation) {
            e.stopPropagation();
        }

        this.scrollIntoView(targetAnchor, this.options.anchors.offset);
        window.location.hash = target.hash;
    }

    private onScroll = (e: Event): void => {
        if (this.isLocked) return;

        this.isStart = false;
        this.isEnd = false;

        this.checkSyncTo();
        this.updateDirection();
    }

    private onWheel = (e: Event) => {
        // @ts-ignore
        if (e.ctrlKey) return;

        e.preventDefault();

        if (this.isLocked) return;

        // @ts-ignore
        this.setTargetPosition(e);

        this.overscrollPropagation(e);

        if (this.rafID === null) {
            requestAnimationFrame(this.onFirstTick)
        }
    }

    private overscrollPropagation(e: Event): void {
        const scrollingOverEdges = (this.isStart && this.targetPosition < this.position) || (this.isEnd && this.targetPosition > this.position);
        if (scrollingOverEdges) return;
        e.stopPropagation();
    }

    private wheelCalculate(wheelEvent: WheelEvent, speed: number): number {
        let delta = wheelEvent[this.fields.delta];

        if (wheelEvent.deltaMode) {
            const deltaMultiply = wheelEvent.deltaMode === 1 ? 40 : 800;
            delta *= deltaMultiply;
        }

        delta *= speed;

        return delta
    }

    private setTargetPosition(e: WheelEvent): void {
        const distance = this.wheelCalculate(e, this.options.speed);
        this.targetPosition = Math.max(Math.min(this.targetPosition + distance, this.scrollContainer[this.fields.scrollSize] - this.scrollContainer[this.fields.clientSize] + MARGIN_ERROR), -MARGIN_ERROR)
    }

    /**
     * @description Обновление направления скрола. Также устанавливает на scrollContainer атрибут data-os-direction
     */
    private updateDirection(): void {
        const direction = this.direction;
        if (direction !== this.lastDirection) {
            this.lastDirection = direction;
            this.toggleDirectionAttr(direction);
            emit(this.eventContainer, OnlyScrollbar.Events.change);
        }
    }

    private toggleDirectionAttr(direction: Direction): void {
        this.scrollContainer.setAttribute(OnlyScrollbar.Attributes.direction, direction < 0 ? 'back' : 'forward');
    }

    private tick = (time: number): void => {
        const deltaTime = time - this.prevTickTime;
        this.prevTickTime = time;

        /**
         * @description Frame Rate Independent Damping using Lerp
         * @link https://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
         */
        const currentDamping = 1 - Math.exp(-this.options.damping * 60 * deltaTime * 0.001);

        const position = +(this.position + currentDamping * (this.targetPosition - this.position));
        this.lastPosition = this.position;

        if (this.lastPosition === position) {
            this.stop();
            return;
        }

        this.position = position;
        this.setValue(position);
        this.rafID = requestAnimationFrame(this.tick);
    }

    private onFirstTick = (time: number): void => {
        this.prevTickTime = time;
        this.isScrolling = true;
        this.scrollContainer.classList.add(OnlyScrollbar.ClassNames.scrolling);
        emit(this.eventContainer, OnlyScrollbar.Events.start)
        if (this.rafID === null) {
            this.rafID = requestAnimationFrame(this.tick);
        }
    }

    private sync(): void {
        const currentPosition = this.scrollContainer[this.fields.scrollOffset];
        this.targetPosition = currentPosition;
        this.lastPosition = currentPosition;
        this.position = currentPosition;
    }

    private checkSyncTo() {
        if (this.syncTo) {
            clearTimeout(this.syncTo);
        }
        this.syncTo = setTimeout(this.stop, 200);
    }

    private checkEdges(): void {
        if (this.isEnd || this.isStart) return;

        const {
            [this.fields.scrollOffset]: scrollOffset,
            [this.fields.clientSize]: clientSize,
            [this.fields.scrollSize]: scrollSize,
        } = this.scrollContainer

        const isStart = scrollOffset === 0;
        if (isStart) {
            this.isStart = isStart;
            emit(this.eventContainer, OnlyScrollbar.Events.reachStart);
            return;
        }

        const isEnd = scrollSize - clientSize === scrollOffset;
        if (isEnd) {
            this.isEnd = isEnd;
            emit(this.eventContainer, OnlyScrollbar.Events.reachEnd);
        }
    }
}

export default OnlyScrollbar