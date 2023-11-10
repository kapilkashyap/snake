import gameConfig from '../../assets/config.js';

/**
 * @author: Kapil Kashyap
 * This is a WIP and will be configuration driven in later versions
 */
const init = () => {
    const addTouchEventListener = (selector, eventName, dispatchEventName, dispatchEventObj) => {
        document.querySelector(selector).addEventListener(eventName, () => {
            document.dispatchEvent(new KeyboardEvent(dispatchEventName, dispatchEventObj));
        }, true);
    };

    // up-arrow
    addTouchEventListener(
        '.direction-buttons .row .top .shape',
        'click',
        'keydown',
        { 'code': 'ArrowUp' }
    );

    // right-arrow
    addTouchEventListener(
        '.direction-buttons .row .right .shape',
        'click',
        'keydown',
        { 'code': 'ArrowRight' }
    );

    // down-arrow
    addTouchEventListener(
        '.direction-buttons .row .down .shape',
        'click',
        'keydown',
        { 'code': 'ArrowDown' }
    );

    // left-arrow
    addTouchEventListener(
        '.direction-buttons .row .left .shape',
        'click',
        'keydown',
        { 'code': 'ArrowLeft' }
    );

    // top-button
    addTouchEventListener(
        '.action-buttons .row .top .button',
        'click',
        'keydown',
        { 'ctrlKey': true, 'code': 'ArrowUp' }
    );

    // right-button
    addTouchEventListener(
        '.action-buttons .row .right .button',
        'click',
        'keydown',
        { 'ctrlKey': true, 'code': 'ArrowRight' }
    );

    // down-button
    addTouchEventListener(
        '.action-buttons .row .down .button',
        'click',
        'keydown',
        { 'ctrlKey': true, 'code': 'ArrowDown' }
    );

    // left-button
    addTouchEventListener(
        '.action-buttons .row .left .button',
        'click',
        'keydown',
        { 'ctrlKey': true, 'code': 'ArrowLeft' }
    );
};

(() => {
    const p1 = new Promise((resolve) => {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                resolve(xmlHttp.responseText);
            }
        };
        xmlHttp.open("GET", `${gameConfig.isDevMode ? '' : 'dist/'}gamepad/direction-buttons.html`, true);
        xmlHttp.send();
    });
    const p2 = new Promise((resolve) => {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                resolve(xmlHttp.responseText);
            }
        };
        xmlHttp.open("GET", `${gameConfig.isDevMode ? '' : 'dist/'}gamepad/action-buttons.html`, true);
        xmlHttp.send();
    });
    Promise.all([p1, p2]).then((values) => {
        document.querySelector(".gamepad").innerHTML = values.join("");
        init();
    });
})();
