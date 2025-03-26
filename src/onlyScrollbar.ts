import {emit, findElementBySelector} from "./utils/utils";
import {DEFAULT_OPTIONS, TICK_BY_MODE, WHEEL_BY_MODE} from "./utils/const";
import {
    ClassNames,
    Delta2D,
    Direction,
    ElementOrSelector,
    OnlyScrollbarEvents,
    OnlyScrollbarModes,
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
 *      - Метод scrollIntoView
 *      - блокировка вложенных скролов (подумать)
 *      - overscroll { boolean } - Функционал подобный нативному overscrollBehavior. Пока не понятно как сделать (default: false)
 *      - easing { string } - Стандартные значения для функций Безье
 *      - Система модулей (?) - Возможность инициализировать отдельный модуль. Например, debug-модуль
 *  - Все параметры хранить в поле options
 */



class OnlyScrollbar {
    /**
     * @description Объект со всеми css-классами, которые используются в скроле
     */
    static readonly ClassNames: ClassNames = {
        container: 'only-scroll-container',
        lock: 'only-scroll--is-locked',
    };
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
    public readonly mode: OnlyScrollbarModes;
    public readonly damping: number;
    public readonly speed: number;
    /**
     * @description Состояние, отображающее блокировку скрола
     */
    public isLocked: boolean;
    public position: Delta2D;
    protected readonly setTargetPosition: (e: WheelEvent) => void;
    private readonly tick: FrameRequestCallback;
    private targetPosition: Delta2D;
    private easedPosition: Delta2D;
    private lastPosition: Delta2D;
    private syncTo?: NodeJS.Timeout;
    private rafID: number | null;
    private lastDirection: Direction | null;
    private isDisable: boolean;

    constructor(element: ElementOrSelector | null | undefined, options?: OnlyScrollbarOptions) {
        const _scrollContainer = findElementBySelector(element);

        if (!_scrollContainer) throw new Error('scrollElement does not exist');

        this.scrollContainer = _scrollContainer;

        const _eventContainer = findElementBySelector(options?.eventContainer) ?? this.scrollContainer;
        this.eventContainer = _eventContainer === document.scrollingElement ? window : _eventContainer;

        this.position = { x: 0, y: 0 };
        this.targetPosition = { x: 0, y: 0 }
        this.easedPosition = { x: 0, y: 0 }
        this.lastPosition = { x: 0, y: 0 }
        this.lastDirection = null;
        this.isLocked = false;
        this.rafID = null
        this.damping = (options?.damping ?? DEFAULT_OPTIONS.damping) * 0.1;
        this.mode = options?.mode ?? DEFAULT_OPTIONS.mode;
        this.speed = options?.speed ?? DEFAULT_OPTIONS.speed;
        this.isDisable = false;

        this.setTargetPosition = WHEEL_BY_MODE[this.mode].bind(this);
        this.tick = TICK_BY_MODE[this.mode].bind(this);

        this.init();
    }
    /**
     * @description Последнее направление скрола в числовом представлении
     * @description 1 = Down|Right, -1 = Up|Left
     */
    public get direction(): Direction {
        const Y = Math.sign(this.position.y - this.lastPosition.y);
        const X = Math.sign(this.position.x - this.lastPosition.x);
        return <Direction>{
            y: Y !== 0 ? Y : this.lastDirection?.y ?? -1,
            x: X !== 0 ? X : this.lastDirection?.x ?? -1
        }
    }

    /**
     * @description Обновление направления скрола. Также устанавливает на scrollContainer атрибут data-scroll-direction со значениями "up" | "down"
     * @description Вызывается автоматически на скрол, но можно вызывать вручную на случай непредвиденных ошибок
     */
    public updateDirection(): void {
        this.lastPosition = this.position
        this.position = {
            x: this.scrollContainer.scrollLeft,
            y: this.scrollContainer.scrollTop
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
    public sync(): void {
        this.syncPos();
        this.rafID = null;
    }

    /**
     * Остановка анимации скрола на текущей позиции
     */
    public stop(): void {
        if (typeof this.rafID === "number") {
            cancelAnimationFrame(this.rafID);
        }
    }

    /**
     * @description Плавный скрол до конкретной позиции, с применением стандартных расчетов для вычисления промежуточных значений
     * @param positionY {number} - Числовое значение целевой позиции скрола
     */
    public scrollTo({ x, y }: Partial<Delta2D>): void {
        if (y === this.position.y && x === this.position.x) return;

        if (!!navigator.maxTouchPoints) {
            this.scrollContainer.scrollTo({
                left: x,
                top: y,
                behavior: "smooth"
            })
            return;
        }

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
    public setValue({ x, y }: Partial<Delta2D>): void {
        this.scrollContainer.scrollTop = y ?? this.position.y;
        this.scrollContainer.scrollLeft = x ?? this.position.x;
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
        this.sync();
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
        this.scrollContainer.removeAttribute('data-scroll-direction-x');
        this.scrollContainer.removeAttribute('data-scroll-direction-y');

        const scrollingElement = this.scrollContainer === document.documentElement ? window : this.scrollContainer;
        scrollingElement.removeEventListener("scroll", this.onScroll);
        this.eventContainer.removeEventListener("wheel", this.onWheel);
    }

    private init(): void {
        this.scrollContainer.style.overflow = 'auto';
        this.scrollContainer.style.scrollBehavior = 'auto';
        this.scrollContainer.dataset.scrollDirectionY = 'up'
        this.scrollContainer.dataset.scrollDirectionX = 'left'
        this.scrollContainer.classList.add(OnlyScrollbar.ClassNames.container);

        this.initEvents();
    }

    /** @todo: Проверить. В логике были ошибки, если передать eventContainer */
    private initEvents(): void {
        const scrollingElement = this.scrollContainer === document.documentElement ? window : this.scrollContainer;
        scrollingElement.addEventListener("scroll", this.onScroll, { passive: true });
        this.addEventListener("wheel", this.onWheel, { passive: false });
    }

    private onScroll = (e: Event): void => {
        if (this.isLocked || this.isDisable) return;

        this.updateDirection();

        this.checkSyncTo();
    }

    private onWheel = (e: Event) => {
        // @ts-ignore
        if (e.ctrlKey) return;

        e.preventDefault();

        if (this.isLocked) return;

        this.manageParentScrollbars(<HTMLElement>e.target);

        if (this.isDisable) return;

        // @ts-ignore
        this.setTargetPosition(e);

        if (this.rafID === null) {
            this.rafID = requestAnimationFrame(this.tick);
        }
    }

    private syncPos(): void {
        const currentPosition = { y: this.scrollContainer.scrollTop, x: this.scrollContainer.scrollLeft };
        this.easedPosition = currentPosition;
        this.targetPosition = currentPosition;
        this.lastPosition = currentPosition;
        this.position = currentPosition;
    }

    private checkSyncTo(): void {
        if (this.syncTo) clearTimeout(this.syncTo);
        this.syncTo = setTimeout(() => {
            emit(this.eventContainer, "scrollEnd");
            this.sync();
        }, 200);
    }

    private manageParentScrollbars(currentTarget: HTMLElement): void {
        if (currentTarget.closest(`.${OnlyScrollbar.ClassNames.container}`)?.isSameNode(this.scrollContainer)) {
            this.isDisable && this.enable();
        } else  {
            !this.isDisable && this.disable();
        }
    }

    private disable(): void {
        this.isDisable = true;
        this.sync();
    }

    private enable(): void {
        this.isDisable = false;
        this.sync();
    }
}

export default OnlyScrollbar