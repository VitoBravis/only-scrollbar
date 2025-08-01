// @ts-nocheck
import {OnlyScrollbarOptions} from "../types";

export const DEFAULT_OPTIONS: Required<Omit<OnlyScrollbarOptions, 'eventContainer'>> = {
    damping: 1,
    speed: 1,
    axis: "Y",
    listenAxis: "Y",
    anchors: {
        offset: 0,
        stopPropagation: false,
        active: true,
        type: 'native'
    }
}

export const IS_TOUCH_DEVICE = !!navigator.maxTouchPoints;

// Погрешность для границ скрол-контейнера
export const MARGIN_ERROR = 3;
