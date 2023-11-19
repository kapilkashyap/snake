import gameConfig from '../../assets/config.js';

/**
 * @author: Kapil Kashyap
 * This is a WIP and will be configuration driven in later versions
 */
const init = () => {
    const comboKeyObject = {
        ctrlKey: false,
        shiftKey: false
    };

    const resetComboKeyObject = () => {
        setTimeout(() => {
            comboKeyObject.shiftKey = false;
            comboKeyObject.ctrlKey = false;
        }, 0);
    };

    const addTouchEventListener = (selector, eventName, dispatchEventName, dispatchEventObj) => {
        document.querySelector(selector).addEventListener(eventName, () => {
            // navigator.vibrate(75);
            document.dispatchEvent(new KeyboardEvent(dispatchEventName, {
                ...dispatchEventObj,
                ...comboKeyObject
            }));
            resetComboKeyObject();
        }, true);
    };

    // up-arrow
    addTouchEventListener(
        '.direction-buttons .row .top.button',
        'click',
        'keydown',
        { 'code': 'ArrowUp' }
    );

    // right-arrow
    addTouchEventListener(
        '.direction-buttons .row .right.button',
        'click',
        'keydown',
        { 'code': 'ArrowRight' }
    );

    // down-arrow
    addTouchEventListener(
        '.direction-buttons .row .down.button',
        'click',
        'keydown',
        { 'code': 'ArrowDown' }
    );

    // left-arrow
    addTouchEventListener(
        '.direction-buttons .row .left.button',
        'click',
        'keydown',
        { 'code': 'ArrowLeft' }
    );

    document.querySelector('.action-buttons .action-button.x').addEventListener('click', () => {
        comboKeyObject.shiftKey = false;
        comboKeyObject.ctrlKey = true;
        // navigator.vibrate(75);
    }, true);

    document.querySelector('.action-buttons .action-button.y').addEventListener('click', () => {
        comboKeyObject.shiftKey = true;
        comboKeyObject.ctrlKey = false;
        // navigator.vibrate(75);
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
        xmlHttp.open("GET", `${gameConfig.isDevMode ? 'gamepad' : 'dist'}/direction-buttons.html`, true);
        xmlHttp.send();
    });
    const p2 = new Promise((resolve) => {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                resolve(xmlHttp.responseText);
            }
        };
        xmlHttp.open("GET", `${gameConfig.isDevMode ? 'gamepad' : 'dist'}/action-buttons.html`, true);
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
