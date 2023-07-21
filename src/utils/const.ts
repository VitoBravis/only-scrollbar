import OnlyScroll, {OnlyScrollModes, OnlyScrollOptions} from "../onlyScroll";
import {wheelCalculate} from "./utils";

export const DEFAULT_OPTIONS: Required<Omit<OnlyScrollOptions, 'eventContainer'>> = {
    damping: 1,
    mode: "vertical"
}

export const TICK_BY_MODE: Record<OnlyScrollModes, FrameRequestCallback> = {
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
        this.rafID = requestAnimationFrame(this.tick);
    },
}

export const WHEEL_BY_MODE: Record<OnlyScrollModes, EventListener> = {
    vertical: function(this: OnlyScroll, e: Event) {
        const { pixelY } = wheelCalculate(<WheelEvent>e);
        this.targetPosition = {
            x: 0,
            y: Math.max(Math.min( this.targetPosition.y + pixelY, this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight), 0)
        };
    },
    horizontal: function(this: OnlyScroll, e: Event) {
        const { pixelX } = wheelCalculate(<WheelEvent>e);
        this.targetPosition = {
            x: Math.max(Math.min( this.targetPosition.x + pixelX, this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth), 0),
            y: 0
        }
    },
    free: function(this: OnlyScroll, e: Event) {
        const { pixelX, pixelY } = wheelCalculate(<WheelEvent>e);
        this.targetPosition = {
            x: Math.max(Math.min( this.targetPosition.x + pixelX, this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth), 0),
            y: Math.max(Math.min( this.targetPosition.y + pixelY, this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight), 0)
        };
    }
}