import {emit, findElementBySelector} from "./utils/utils.js";
import {DEFAULT_OPTIONS, TICK_BY_MODE, WHEEL_BY_MODE} from "./utils/const.js";

class OnlyScrollbar {
    static classNames = {
        container: 'only-scroll-container',
        lock: 'only-scroll--is-locked',
    };
    scrollContainer;
    eventContainer;
    isLocked;
    position;
    targetPosition;
    easedPosition;
    lastPosition;
    mode;
    damping;
    syncTo;
    rafID;
    lastDirection;
    lastHash;
    isDisable;
    setTargetPosition;
    tick;
    directionAttribute;

    constructor(element, options) {
        const _scrollContainer =  findElementBySelector(element);

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
        this.directionAttribute = options?.directionAttribute ?? DEFAULT_OPTIONS.directionAttribute;
        this.lastHash = window.location.hash;
        this.isDisable = false;

        this.setTargetPosition = WHEEL_BY_MODE[this.mode].bind(this);
        this.tick = TICK_BY_MODE[this.mode].bind(this);

        this.init();
    }

    get direction() {
        const Y = Math.sign(this.position.y - this.lastPosition.y);
        const X = Math.sign(this.position.x - this.lastPosition.x);
        return {
            y: Y !== 0 ? Y : this.lastDirection?.y ?? -1,
            x: X !== 0 ? X : this.lastDirection?.x ?? -1
        }
    }

    updateDirection() {
        this.lastPosition = this.position
        this.position = {
            x: this.scrollContainer.scrollLeft,
            y: this.scrollContainer.scrollTop
        }
        const {x, y} = this.direction;
        if (x !== this.lastDirection?.x) {
            if (this.directionAttribute) {
                this.scrollContainer.dataset.scrollDirectionX = x !== 1 ? "left" : "right";
            }
            emit(this.eventContainer, "changeDirectionX")
        }
        if (y !== this.lastDirection?.y) {
            if (this.directionAttribute) {
                this.scrollContainer.dataset.scrollDirectionY = y !== 1 ? "up" : "down";
            }
            emit(this.eventContainer, "changeDirectionY")
        }
        this.lastDirection = {x, y};
    }

    sync() {
        this.syncPos();
        this.rafID = null;
    }

    scrollTo({ x, y }) {
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

    setValue({ x, y }) {
        this.scrollContainer.scrollTop = y ?? this.position.y;
        this.scrollContainer.scrollLeft = x ?? this.position.x;
    }

    lock() {
        if (this.isLocked) return;

        this.scrollContainer.style.overflow = 'hidden';
        this.scrollContainer.classList.add(OnlyScrollbar.classNames.lock);
        this.removeEventListener("wheel", this.onWheel);
        this.isLocked = true
        this.sync();
    }

    unlock() {
        if (!this.isLocked) return;

        this.scrollContainer.style.overflow = 'auto';
        this.scrollContainer.classList.remove(OnlyScrollbar.classNames.lock);
        this.addEventListener("wheel", this.onWheel, { passive: false });
        this.isLocked = false;
        if (this.rafID === null) {
            this.rafID = requestAnimationFrame(this.tick);
        }
    }

    addEventListener(type, listener, options) {
        this.eventContainer.addEventListener(type, listener, options)
    }

    removeEventListener(type, listener) {
        this.eventContainer.removeEventListener(type, listener)
    }

    destroy() {
        if (this.syncTo) clearTimeout(this.syncTo);
        this.rafID = null;
        this.scrollContainer.style.removeProperty('overflow');
        this.scrollContainer.classList.remove(...Object.values(OnlyScrollbar.classNames));
        this.scrollContainer.removeAttribute('data-scroll-direction-x');
        this.scrollContainer.removeAttribute('data-scroll-direction-y');

        const scrollingElement = this.scrollContainer === document.documentElement ? window : this.scrollContainer;
        scrollingElement.removeEventListener("scroll", this.onScroll);
        this.eventContainer.removeEventListener("wheel", this.onWheel);
    }

    init() {
        this.scrollContainer.style.overflow = 'auto';
        this.scrollContainer.style.scrollBehavior = 'auto';
        if (this.directionAttribute) {
            this.scrollContainer.dataset.scrollDirectionY = 'up'
            this.scrollContainer.dataset.scrollDirectionX = 'left'
        }
        this.scrollContainer.classList.add(OnlyScrollbar.classNames.container);

        this.initEvents();
    }

    initEvents() {
        const scrollingElement = this.scrollContainer === document.documentElement ? window : this.scrollContainer;
        scrollingElement.addEventListener("scroll", this.onScroll, { passive: true });
        this.addEventListener("wheel", this.onWheel, { passive: false });
    }

    onScroll = () => {
        if (this.isLocked || this.isDisable) return;

        this.updateDirection();

        if (window.location.hash !== this.lastHash) {
            this.lastHash = window.location.hash;
            this.syncPos();
            return;
        }

        this.checkSyncTo();
    }

    onWheel = (e) => {
        if (e.ctrlKey) return;

        e.preventDefault();

        if (this.isLocked) return;

        this.manageParentScrollbars(e.target);

        if (this.isDisable) return;

        this.setTargetPosition(e);

        if (this.rafID === null) {
            this.rafID = requestAnimationFrame(this.tick);
        }
    }

    syncPos() {
        const currentPosition = { y: this.scrollContainer.scrollTop, x: this.scrollContainer.scrollLeft };
        this.easedPosition = currentPosition;
        this.targetPosition = currentPosition;
        this.lastPosition = currentPosition;
        this.position = currentPosition;
    }

    stop() {
        cancelAnimationFrame(this.rafID);
    }

    checkSyncTo() {
        if (this.syncTo) clearTimeout(this.syncTo);
        this.syncTo = setTimeout(() => {
            emit(this.eventContainer, "scrollEnd");
            this.sync();
        }, 200);
    }

    manageParentScrollbars(currentTarget) {
        if (currentTarget.closest(`.${OnlyScrollbar.classNames.container}`)?.isSameNode(this.scrollContainer)) {
            this.isDisable && this.enable();
        } else  {
            !this.isDisable && this.disable();
        }
    }

    disable() {
        this.isDisable = true;
        this.sync();
    }

    enable() {
        this.isDisable = false;
        this.sync();
    }
}

export default OnlyScrollbar