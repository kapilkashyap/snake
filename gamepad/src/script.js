import gameConfig from '../../assets/config.js';

/**
 * @author: Kapil Kashyap
 * This is a WIP and will be configuration driven in later versions
 */
const init = () => {
    let isCtrlKey = false;
    let isShiftKey = false;

    const addTouchEventListener = (selector, eventName, dispatchEventName, dispatchEventObj) => {
        document.querySelector(selector).addEventListener(eventName, () => {
            // navigator.vibrate(75);
            document.dispatchEvent(new KeyboardEvent(dispatchEventName, {
                ...dispatchEventObj, ctrlKey: isCtrlKey, shiftKey: isShiftKey
            }));
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

    document.querySelector('.action-buttons .action-button.x .button').addEventListener('touchstart', () => {
        isCtrlKey = true;
        // navigator.vibrate(75);
    }, true);

    document.querySelector('.action-buttons .action-button.x .button').addEventListener('touchend', () => {
        isCtrlKey = false;
    }, true);

    document.querySelector('.action-buttons .action-button.y .button').addEventListener('touchstart', () => {
        isShiftKey = true;
        // navigator.vibrate(75);
    }, true);

    document.querySelector('.action-buttons .action-button.y .button').addEventListener('touchend', () => {
        isShiftKey = false;
    }, true);
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
        const gamepad = document.querySelector(".gamepad");
        if (gamepad !== null) {
          gamepad.innerHTML = values.join("");
          init();
        }
    });
})();
