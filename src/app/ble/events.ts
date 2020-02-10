/**
 * @hidden
 */
export class DOMEvent implements Event {

    /**
     * Type of the event
     */
    public type: string;

    /**
     * @hidden
     */
    public target: EventTarget;

    /**
     * @hidden
     */
    public currentTarget: EventTarget;

    /**
     * @hidden
     */
    public srcElement: EventTarget;

    /**
     * @hidden
     */
    public timeStamp: number;

    /**
     * @hidden
     */
    public bubbles = true;

    /**
     * @hidden
     */
    public cancelable = false;

    /**
     * @hidden
     */
    public cancelBubble = false;

    /**
     * @hidden
     */
    public composed = false;

    /**
     * @hidden
     */
    public defaultPrevented = false;

    /**
     * @hidden
     */
    public eventPhase = 0;

    /**
     * @hidden
     */
    public isTrusted = true;

    /**
     * @hidden
     */
    public returnValue = true;

    /**
     * @hidden
     */
    public AT_TARGET: number;

    /**
     * @hidden
     */
    public BUBBLING_PHASE: number;

    /**
     * @hidden
     */
    public CAPTURING_PHASE: number;

    /**
     * @hidden
     */
    public NONE: number;

    constructor(target: EventTarget, type: string) {
        this.target = target;
        this.srcElement = target;
        this.currentTarget = target;
        this.type = type;
    }

    /**
     * @hidden
     */
    public composedPath(): Array<EventTarget> {
        return [];
    }

    /**
     * @hidden
     */
    public initEvent(type: string, bubbles?: boolean, cancelable?: boolean) {
        this.type = type;
        this.bubbles = bubbles;
        this.cancelable = cancelable;
    }

    /**
     * @hidden
     */
    public preventDefault() {
        this.defaultPrevented = true;
    }

    /**
     * @hidden
     */
    public stopImmediatePropagation() {
        return;
    }

    /**
     * @hidden
     */
    public stopPropagation() {
        return;
    }
}
