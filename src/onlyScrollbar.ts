import {emit, findElementBySelector, getFieldsByAxis} from "./utils/utils";
import {DEFAULT_OPTIONS, IS_TOUCH_DEVICE, MARGIN_ERROR} from "./utils/const";
import {
    Attributes,
    ClassNames,
    Direction,
    ElementOrSelector, InternalFields,
    OnlyScrollbarEvents,
    OnlyScrollbarOptions
} from "./types";

/**
 * TODO:
 *  + Поменять JS на TS файлы
 *  - Сделать отдельную версию для React
 *  - Расширить параметры инициализации:
 *      + speed {number} - множитель для значения wheelDelta (default: 1)
 *      - listenAxis {"x" | "y"} - Определяет какое направление колесика будет прослушиваться. По умолчанию совпадает с direction
 *      - scrollAnchors { object } - Включает/выключает обработку стандартных якорей-ссылок
 *      + Метод scrollIntoView
 *      - блокировка вложенных скролов (подумать)
 *      - overscroll { boolean } - Функционал подобный нативному overscrollBehavior. Пока не понятно как сделать (default: false)
 *      - Система модулей (?) - Возможность инициализировать отдельный модуль. Например, debug-модуль
 *  - Все параметры хранить в поле options
 */



class OnlyScrollbar {
    /**
     * @description Объект со всеми css-классами, которые используются в скроле
     */
    static ClassNames: ClassNames = {
        container: 'os-container',
        lock: 'os--is-locked',
    };
    static Attributes: Attributes = {
        anchor: 'data-os-anchor',
        direction: 'data-os-direction'
    }
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
    private targetPosition: number;
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
        this.lastDirection = null;
        this.isLocked = false;
        this.isEnd = false;
        this.isStart = true;
        this.rafID = null
        this.options = {
            anchors: {...DEFAULT_OPTIONS.anchors, ...(options.anchors ?? {})},
            speed: options?.speed ?? DEFAULT_OPTIONS.speed,
            eventContainer: this.eventContainer,
            axis: options?.axis ?? DEFAULT_OPTIONS.axis,
            listenAxis: options?.listenAxis ?? options?.axis ?? DEFAULT_OPTIONS.listenAxis,
            damping: (options?.damping ?? DEFAULT_OPTIONS.damping) * 0.1
        }
        this.fields = getFieldsByAxis(this.options.axis, this.options.listenAxis);

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
     * @description Обновление направления скрола. Также устанавливает на scrollContainer атрибут data-os-direction
     * @description Вызывается автоматически на скрол, но можно вызывать вручную на случай непредвиденных ошибок
     */
    public updateDirection(): void {
        const direction = this.direction;
        if (direction !== this.lastDirection) {
            this.scrollContainer.setAttribute(OnlyScrollbar.Attributes.direction, direction > 0 ? 'forward' : 'back');
            emit(this.eventContainer, "changeDirection");
        }
    }

    /**
     * Остановка анимации скрола на текущей позиции
     */
    public stop(): void {
        if (typeof this.rafID === "number") {
            cancelAnimationFrame(this.rafID);
            this.rafID = null;
        }
        emit(this.eventContainer, 'scrollEnd');
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
        this.rafID = requestAnimationFrame(this.tick);
    }

    public scrollIntoView(element: HTMLElement, offset: number = 0): void {
        const targetPosition = this.position + element.getBoundingClientRect()[this.fields.offset] - offset!;
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
            this.rafID = requestAnimationFrame(this.tick);
        }
    }

    // @todo: Надо поправить типы для второго аргумента
    public addEventListener(type: OnlyScrollbarEvents | keyof HTMLElementEventMap, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void {
        this.eventContainer.addEventListener(type, listener, options);
    }
    // @todo: Надо поправить типы для второго аргумента
    public removeEventListener(type: OnlyScrollbarEvents | keyof HTMLElementEventMap, listener: EventListenerOrEventListenerObject): void {
        this.eventContainer.removeEventListener(type, listener);
    }

    public destroy(): void {
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
        this.scrollContainer.classList.add(OnlyScrollbar.ClassNames.container);

        this.initEvents();
    }

    /** @todo: Проверить. В логике были ошибки, если передать eventContainer */
    private initEvents(): void {
        const scrollingElement = this.scrollContainer === document.documentElement ? window : this.scrollContainer;
        scrollingElement.addEventListener("scroll", this.onScroll, { passive: true });
        scrollingElement.addEventListener("click", this.onClick);
        this.addEventListener("wheel", this.onWheel, { passive: false });
    }

    private onClick = (e: Event): void => {
        /**
         * @todo: Проверка EventTarget на ссылку и наличе хэша. Перехват стандартного поведения браузера
         */
    }

    private onScroll = (e: Event): void => {
        if (this.isLocked) return;

        this.isStart = false;
        this.isEnd = false;

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
            this.rafID = requestAnimationFrame(this.tick);
        }
    }

    private overscrollPropagation(e: Event): void {
        if (this.isStart && this.targetPosition < this.position) return;
        if (this.isEnd && this.targetPosition > this.position) return;
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

    private tick = (): void => {
        const position = +(this.position + this.options.damping * (this.targetPosition - this.position)).toFixed(2);
        this.lastPosition = this.position;

        if (this.lastPosition === position) {
            this.stop();
            return;
        }

        this.position = position;
        this.setValue(position);
        this.rafID = requestAnimationFrame(this.tick);
    }

    private sync(): void {
        const currentPosition = this.scrollContainer[this.fields.scrollOffset];
        this.targetPosition = currentPosition;
        this.lastPosition = currentPosition;
        this.position = currentPosition;
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
            emit(this.eventContainer, 'reachStart');
            return;
        }

        const isEnd = scrollSize - clientSize === scrollOffset;
        if (isEnd) {
            this.isEnd = isEnd;
            emit(this.eventContainer, 'reachEnd');
        }
    }
}

export default OnlyScrollbar