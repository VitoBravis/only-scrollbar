import {wheelCalculate} from "./utils.js";

const DEFAULT_OPTIONS = {
    damping: 1,
    mode: "vertical",
    directionAttribute: true
}

/**
 *
 * @type Object
 */
const TICK_BY_MODE = {
    vertical: function() {
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
    horizontal: function() {
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
    free: function() {
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
/**
 *
 * @type Object
 */
const WHEEL_BY_MODE = {
    vertical: function(e) {
        const { y } = wheelCalculate(e);
        this.targetPosition = {
            x: 0,
            y: Math.max(Math.min( this.targetPosition.y + y, this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight), 0)
        };
    },
    horizontal: function(e) {
        const { x } = wheelCalculate(e);
        this.targetPosition = {
            x: Math.max(Math.min( this.targetPosition.x + x, this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth), 0),
            y: 0
        }
    },
    free: function(e) {
        const { x, y } = wheelCalculate(e);
        this.targetPosition = {
            x: Math.max(Math.min( this.targetPosition.x + x, this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth), 0),
            y: Math.max(Math.min( this.targetPosition.y + y, this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight), 0)
        };
    }
}

export { WHEEL_BY_MODE, TICK_BY_MODE, DEFAULT_OPTIONS, wheelCalculate}