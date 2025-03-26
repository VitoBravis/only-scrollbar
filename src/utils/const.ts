// @ts-nocheck
import {wheelCalculate} from "./utils";
import OnlyScrollbar from "../onlyScrollbar";
import {Delta2D, IOnlyScrollbar, OnlyScrollbarModes, OnlyScrollbarOptions} from "../types";

export const DEFAULT_OPTIONS: Required<Omit<OnlyScrollbarOptions, 'eventContainer'>> = {
    damping: 1,
    speed: 1,
    mode: "vertical",
}

// Погрешность для границ скрол-контейнера
const MARGIN_ERROR = 3;

export const TICK_BY_MODE: Record<OnlyScrollbarModes, VoidFunction> = {
    vertical: function(this: IOnlyScrollbar): void {
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
        this.rafID = requestAnimationFrame(this.tick);
    },
    horizontal: function(this: IOnlyScrollbar): void {
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
        this.rafID = requestAnimationFrame(this.tick);
    },
    free: function(this: IOnlyScrollbar): void {
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
        this.rafID = requestAnimationFrame(this.tick);
    },
}

export const WHEEL_BY_MODE: Record<OnlyScrollbarModes, (e: WheelEvent) => void> = {
    vertical: function(this: IOnlyScrollbar, e) {
        const { y } = wheelCalculate(e, this.speed);
        this.targetPosition = {
            x: 0,
            y: Math.max(Math.min(this.targetPosition.y + y, this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight + MARGIN_ERROR), -MARGIN_ERROR)
        };
    },
    horizontal: function(this: IOnlyScrollbar, e) {
        const { x } = wheelCalculate(e, this.speed);
        this.targetPosition = {
            x: Math.max(Math.min(this.targetPosition.x + x, this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth + MARGIN_ERROR), -MARGIN_ERROR),
            y: 0
        }
    },
    free: function(this: IOnlyScrollbar, e) {
        const { x, y } = wheelCalculate(e, this.speed);
        this.targetPosition = {
            x: Math.max(Math.min(this.targetPosition.x + x, this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth + MARGIN_ERROR), -MARGIN_ERROR),
            y: Math.max(Math.min(this.targetPosition.y + y, this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight + MARGIN_ERROR), -MARGIN_ERROR)
        };
    }
}