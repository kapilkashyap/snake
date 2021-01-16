/**
 * @author: Kapil Kashyap
 * This is a WIP and will be configuration driven in later versions
 */
const init = () => {
//     console.log('gamepad script');
    const addTouchEventListener = (selector, eventName, dispatchEventName, dispatchEventObj) => {
        document.querySelector(selector).addEventListener(eventName, (e) => {
            document.dispatchEvent(new KeyboardEvent(dispatchEventName, dispatchEventObj));
        }, true);
    };

    // up-arrow
    addTouchEventListener(
        '.direction-buttons .row .top .shape',
        'click',
        'keydown',
        { 'keyCode': '38' }
    );

    // right-arrow
    addTouchEventListener(
        '.direction-buttons .row .right .shape',
        'click',
        'keydown',
        { 'keyCode': '39' }
    );

    // down-arrow
    addTouchEventListener(
        '.direction-buttons .row .down .shape',
        'click',
        'keydown',
        { 'keyCode': '40' }
    );

    // left-arrow
    addTouchEventListener(
        '.direction-buttons .row .left .shape',
        'click',
        'keydown',
        { 'keyCode': '37' }
    );

    // top-button
    addTouchEventListener(
        '.action-buttons .row .top .button',
        'click',
        'keydown',
        { 'ctrlKey': true, 'keyCode': '38' }
    );

    // right-button
    addTouchEventListener(
        '.action-buttons .row .right .button',
        'click',
        'keydown',
        { 'ctrlKey': true, 'keyCode': '39' }
    );

    // down-button
    addTouchEventListener(
        '.action-buttons .row .down .button',
        'click',
        'keydown',
        { 'ctrlKey': true, 'keyCode': '40' }
    );

    // left-button
    addTouchEventListener(
        '.action-buttons .row .left .button',
        'click',
        'keydown',
        { 'ctrlKey': true, 'keyCode': '37' }
    );
};

(() => {
    let p1 = new Promise((resolve, reject) => {
        let xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                resolve(xmlHttp.responseText);
            }
        };
        xmlHttp.open("GET", "gamepad/direction-buttons.html", true);
        xmlHttp.send();
    });
    let p2 = new Promise((resolve, reject) => {
        let xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                resolve(xmlHttp.responseText);
            }
        };
        xmlHttp.open("GET", "gamepad/action-buttons.html", true);
        xmlHttp.send();
    });
    Promise.all([p1, p2]).then((values) => {
        document.querySelector(".gamepad").innerHTML = values.join("");
        init();
    });
})();
