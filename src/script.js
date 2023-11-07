/**
 * @author: Kapil Kashyap
 */
(function() {
    // DEFAULT SETTINGS
    let row;
    let column;
    let snakeLength=3;
    let snakeLife=3;
    let defaultDirection="north";
    let direction=defaultDirection;
    let prevDirection;
    let prevSnakeLength=0;
    let rowsCount;
    let columnsCount;
    let totalRectsCount;
    let totalRectsCountChallengeMode;

    // SPEED SETTINGS
    let baseTime=440;
    let speedCutOff=40;
    let classicModeBaseTime=340;//240
    let classicModeSpeedCutOff=100;//60
    let mazeModeSpeedCutOff=152;
    let reduction=40;
    let speed;

    // THRESHOLDS
    let baseThresholds=[];
    let northThreshold;
    let westThreshold;
    let eastThreshold;
    let southThreshold;

    // MODES
    let availableModes=['classic', 'challenge', 'maze'];
    let unlockedModes=['classic', 'challenge', 'maze'];
    let selectedMode=availableModes[0];

    // TOUCH EVENT VARIABLES
    // let isGesture=false;
    // let startX;
    // let startY;
    // let endX;
    // let endY;
    // let deltaX;
    // let deltaY;
    // let startTime;
    // let elapsedTime;
    // let swipeDirection;
    // let swipeAngle;
    // let swipeAngleMinThreshold;
    // let swipeAngleMaxThreshold;
    // let thresholdPassed=false;
    // let swipeThreshold=25; //required minimum distance traveled to be considered swipe
    // let defaultSwipeAngleMinThreshold=27; //minimum restraint for a right-angled movement
    // let defaultSwipeAngleMaxThreshold=63; //maximum restraint for a right-angled movement
    // let allowedTime=300; //maximum time allowed to travel that distance

    // GAME CONFIG
    let interval;
    let timerInterval;
    let scoreInterval;
    let flickerInterval;
    let coordinates;
    let selectedCoordinates;
    let nodes=[];
    let removeNodes=[];
    let meals=[];
    let dangers=[];
    let movesQueue=[];
    let gameState;
    let levelUpPeriod;
    let maxLevel;
    let mazePathTraversed=0;
    let gameProgressFactor;
    let gameProgressBar=document.querySelector(".game-indicator .progress-bar");
    let level=1;
    let levelNode=document.querySelector(".level>.value");
    let incrementLevel=false;
    let score=0;
    let scoreNode=document.querySelector(".score>.value");
    // let time=0.0;
    // let timerNode=document.querySelector(".time>.value");
    let isPortableMode=(function() {
        if( /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent) ) {
            if( /iPad/i.test(navigator.userAgent) ) {
                document.body.style.zoom="175%";
            }
            else {
                document.body.style.zoom="200%";
            }
            document.body.classList.add("portable-device");
            return true;
        }
        return false;
    })();

    // MESSAGES
    let messages={
        "START": isPortableMode ? "Press play button to start." : "Press space bar to start.",
        "RESET": isPortableMode ? "Press reset button." : "Press 'R' to reset.",
        "PAUSE": isPortableMode ? "" : "Press space bar to pause.",
        "RESUME": isPortableMode ? "Press play button to resume." : "Press space bar to resume.",
        "LIVES_REMAINING": "lives remaining!",
        "LIFE_REMAINING": "life remaining!",
        "GAME_OVER": "Game over!",
        "CONGRATULATIONS": "Congratulations",
        "LEVEL_UNLOCKED": "level unlocked!",
        "AMAZING": "Amazing",
        "ALL_LEVELS_COMPLETED": "all levels completed!",
        "TOP_3_SCORES": "Your top 3 scores will appear here...",
        "PLAY_BUTTON_LABEL": "Play",
        "PAUSE_BUTTON_LABEL": "Pause",
        "DISCLAIMER": "Works best on desktop.",
        "EXCLAMATION": "!",
        "COMMA": ", ",
        "SPACE": " "
    };

    const setupArena = function() {
        let arena=document.querySelector(".game-arena-display");
        let dimensions=arena.getBoundingClientRect();
        let sampleTile=arena.querySelector("div");
        let tileDimension=getDimension(sampleTile);
        let div=document.createElement("DIV");
        let clone=null;
        let r=1;
        let c=1;
        rowsCount=Math.floor(dimensions.height / tileDimension.height);
        columnsCount=Math.floor(dimensions.width / tileDimension.width);
        totalRectsCount=columnsCount * rowsCount;
        baseThresholds=[0,columnsCount];

        // clean up
        sampleTile.remove();

        for(let index=0; index < totalRectsCount; index++) {
            c=index%columnsCount + 1;
            if(index >= columnsCount && c===1) {
                r++;
            }
            clone=div.cloneNode();
            clone.setAttribute("data", [r,c]);
            clone.setAttribute("class", "empty rc_" + r + "_" + c);
            arena.appendChild(clone);
        }

        // set global variables
        updateGameArenaThresholds(baseThresholds);
        setSpeed();
        levelUpPeriod=calculateLevelUpPeriod();
        updateMessage(messages.START);
        registerKeys();
    };

    const registerKeys = function() {
        document.querySelectorAll(".life .value span").forEach(function(node) {
            node.innerHTML="&#9829;";
        });

        document.addEventListener("keydown", function(event) {
            event.stopPropagation();
            event.preventDefault();
            if(event.keyCode===38 || event.keyCode===87) {
                if(event.shiftKey && (direction==="east" || direction==="west")) {
                    handleDoubleDirectionChange(["north", direction]);
                }
                else if(event.ctrlKey && (direction==="east" || direction==="west")) {
                    handleDoubleDirectionChange(["north", direction==="east" ? "west" : "east"]);
                }
                else {
                    handleDirectionChange("north");                        
                }
            }
            else if(event.keyCode===39 || event.keyCode===68) {
                if(event.shiftKey && (direction==="north" || direction==="south")) {
                    handleDoubleDirectionChange(["east", direction]);
                }
                else if(event.ctrlKey && (direction==="north" || direction==="south")) {
                    handleDoubleDirectionChange(["east", direction==="north" ? "south" : "north"]);
                }
                else {
                    handleDirectionChange("east");
                }
            }
            else if(event.keyCode===40 || event.keyCode===83) {
                if(event.shiftKey && (direction==="east" || direction==="west")) {
                    handleDoubleDirectionChange(["south", direction]);
                }
                else if(event.ctrlKey && (direction==="east" || direction==="west")) {
                    handleDoubleDirectionChange(["south", direction==="east" ? "west" : "east"]);
                }
                else {
                    handleDirectionChange("south");
                }
            }
            else if(event.keyCode===37 || event.keyCode===65) {
                if(event.shiftKey && (direction==="north" || direction==="south")) {
                    handleDoubleDirectionChange(["west", direction]);
                }
                else if(event.ctrlKey && (direction==="north" || direction==="south")) {
                    handleDoubleDirectionChange(["west", direction==="north" ? "south" : "north"]);
                }
                else {
                    handleDirectionChange("west");
                }
            }
            else if (event.keyCode===32 && (gameState==="stopped" || gameState===undefined)) {
                playEventHandler();
            }
            else if (event.keyCode===32 && gameState!=="over") {
                pauseEventHandler();
            }
            else if (event.keyCode===82 && interval===undefined) { //reset
                resetEventHandler();
            }
        });

        if(isPortableMode) {
            document.querySelector(".gamepad").classList.remove("hide");
            document.querySelector(".game-actions").classList.remove("hide");
        }

        updateActionButtonLabel();

        document.querySelector(".game-actions .play-pause").addEventListener("touchstart", function(event) {
            event.stopPropagation();
            event.preventDefault();

            disableResetButton();
            if (gameState==="stopped" || gameState===undefined) {
                playEventHandler();
            }
            else if (gameState!=="over") {
                pauseEventHandler();
            }
        }, { passive: false });

        document.querySelector(".game-actions .reset").addEventListener("touchstart", function(event) {
            event.stopPropagation();
            event.preventDefault();

            if(this.querySelector("button").disabled) {
                return;
            }

            if (interval===undefined) { //reset
                resetEventHandler();
            }
        }, { passive: false });

        window.addEventListener("blur", function() {
            if(gameState==="play") {
                pauseEventHandler();
            }
        }, { passive: false });
    };

    const handleDoubleDirectionChange = function(doubleDirection) {
        if (gameState==="play" /*&& movesQueue[0]!==doubleDirection[0]*/) {
            movesQueue.unshift(doubleDirection[0]);
            movesQueue.unshift(doubleDirection[1]);
        }
    };

    const handleDirectionChange = function(directionChangedTo) {
        if (gameState==="play" && movesQueue[0]!==directionChangedTo) {
            if (directionChangedTo==="north" && movesQueue[0]!=="south" && direction!=="south") { //north
                movesQueue.unshift(directionChangedTo);
            }
            else if (directionChangedTo==="east" && movesQueue[0]!=="west" && direction!=="west") { //east
                movesQueue.unshift(directionChangedTo);
            }
            else if (directionChangedTo==="south" && movesQueue[0]!=="north" && direction!=="north") { //south
                movesQueue.unshift(directionChangedTo);
            }
            else if (directionChangedTo==="west" && movesQueue[0]!=="east" && direction!=="east") { //west
                movesQueue.unshift(directionChangedTo);
            }
        }
    };

    const playEventHandler = function() {
        updateRowColumnDirection();
        updateLevel(+retrieveItem("selected" + capitalize(selectedMode) + "Level") || 1);
        setSpeed();
        setSpeedInterval();
        // setTimer();
        setScorer();
        if (gameState===undefined) {
            updateLife(true);
            generateFood();
        }
        setSnakeLength();
        setGameState("play");
        updateMessage(messages.PAUSE);
        hideInstructions();
        isPortableMode && updateActionButtonLabel(messages.PAUSE_BUTTON_LABEL);
    };

    const pauseEventHandler = function() {
        if (gameState!=="paused" && gameState!=="lifeLost") {
            interval=clearInterval(interval);
            timerInterval=clearInterval(timerInterval);
            scoreInterval=clearInterval(scoreInterval);
            flickerInterval=clearInterval(flickerInterval);
            setGameState("paused");
            updateMessage(messages.RESUME);
            if(isPortableMode) {
                updateActionButtonLabel(messages.PLAY_BUTTON_LABEL);
                disableResetButton(false);
            }
        }
        else if (gameState==="paused" || gameState==="lifeLost") {
            removeTrail();
            if (gameState==="lifeLost") {
                !isMazeMode() && clearNodes();
                defaultSettings();
                generateFood();
            }
            setSpeedInterval();
            // setTimer();
            setScorer();
            setGameState("play");
            updateMessage(messages.PAUSE);
            if(isPortableMode) {
                updateActionButtonLabel(messages.PAUSE_BUTTON_LABEL);
                disableResetButton();
            }
        }
    };

    const resetEventHandler = function() {
        setGameState("over");
        clearNodes();
        updateLife();
        defaultSettings();
        updateMessage(messages.START);
        hideInstructions(false);
        resetGameProgress();
        if(isPortableMode) {
            toggleHide("play-pause");
            updateActionButtonLabel(messages.PLAY_BUTTON_LABEL);
            disableResetButton();
        }
        removeTrail();
        removeCrossHair();
    };

    const defaultSettings = function() {
        updateRowColumnDirection();
        interval=undefined;
        flickerInterval=clearInterval(flickerInterval);
        meals=[];

        if(gameState==="over") {
            setGameState(); // purposefully setting state to undefined
            snakeLife=3;
            setSnakeLength();
            score=0;
            scoreNode.innerText=score;
            // time=0.0;
            // timerNode.innerText="0s";
            setSpeed();
        }
        else {
            if(!isMazeMode()) {
                if(prevSnakeLength < nodes.length+removeNodes.length) {
                    setSnakeLength(nodes.length+removeNodes.length);
                }
            }
        }

        // clear if there are any left-overs
        document.querySelectorAll(".flicker").forEach(function(node) {
           removeEntityFromNode(node, "flicker");
        });
        document.querySelectorAll(".food").forEach(function(node) {
           removeEntityFromNode(node, "food");
        });
    };

    const setDirection = function(_direction) {
        direction=_direction||defaultDirection;
    };

    const setGameState = function(state) {
        gameState=state;
    };

    const applySnakeBodyCurve = function(_directionChangedTo) {
        if(_directionChangedTo===prevDirection) {
            return;
        }

        let snakeBodyCurveClass=null;
        if (_directionChangedTo==="north") {
            snakeBodyCurveClass=prevDirection==="east" ? "se" : (prevDirection==="west" ? "sw" : null);
        }
        else if (_directionChangedTo==="east") {
            snakeBodyCurveClass=prevDirection==="south" ? "sw" : (prevDirection==="north" ? "nw" : null);
        }
        else if (_directionChangedTo==="south") {
            snakeBodyCurveClass=prevDirection==="east" ? "ne" : (prevDirection==="west" ? "nw" : null);
        }
        else if (_directionChangedTo==="west") {
            snakeBodyCurveClass=prevDirection==="south" ? "se" : (prevDirection==="north" ? "ne" : null);
        }
        snakeBodyCurveClass && addEntity([row, column], snakeBodyCurveClass);
    };

    // INTERVALS
    const setSpeedInterval = function(_speed) {
        // making sure the interval is cleared before setting a new interval
        interval=clearInterval(interval);
        interval=setInterval(function() {
            if(movesQueue.length>0) {
                prevDirection=direction;
                setDirection(movesQueue.pop());
                applySnakeBodyCurve(direction);
            }
            moveSnake();
        }, _speed||speed);
    };

    // const setTimer = function() {
    //     timerInterval=setInterval(function() {
    //         timerNode.innerText=(time+=.1).toFixed(1) + "s";
    //     },100);
    // };

    const setScorer = function() {
        scoreInterval=setInterval(function() {
            score += level*snakeLife;
            scoreNode.innerText=score;
        },100);
    };

    // UTILITY METHODS
    const capitalize = function(s) {
        return s[0].toUpperCase() + s.slice(1);   
    };

    const getDimension = function (node) {
        let style=getComputedStyle(node);
        let width=parseFloat(style.marginLeft) + parseFloat(style.marginRight)
            + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth)
            + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
            + parseFloat(style.width);
        let height=parseFloat(style.marginTop) + parseFloat(style.marginBottom)
            + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
            + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
            + parseFloat(style.height);

        return { width, height };
    };

    const isClassicMode = function() {
        return selectedMode==="classic";
    };

    const isChallengeMode = function() {
        return selectedMode==="challenge";
    };

    const isMazeMode = function() {
        return selectedMode==="maze";
    };

    const setSnakeLength = function(length) {
        snakeLength=(length || getDefaultSnakeLength());
        prevSnakeLength=snakeLength;
    };

    const getDefaultSnakeLength = function() {
        return isClassicMode() ? (level===1 ? 3 : levelUpPeriod*(level-1)) : (10+level);
    };

    const updateScore = function(points) {
        score += (points || 10) * level;
    };

    const removeTrail = function() {
        document.querySelectorAll(".game-arena-display div.trail").forEach(function(node) {
            node.classList.remove("trail");
        });  
    };

    // const addLife = function() {
    //     document.querySelector("span:nth-of-type(" + ++snakeLife + ")").classList.add("available");
    // };

    const loseLife = function() {
        document.querySelector("span.available:nth-of-type(" + snakeLife-- + ")").classList.remove("available");
    };

    const updateLife = function(reset) {
        document.querySelectorAll("span").forEach(function(node) {
            node.classList[reset ? "add" : "remove"]("available");
        });
    };

    const updateMessage = function(msg) {
        document.querySelector("div.message").innerHTML=msg || "";
    };

    const updateActionButtonLabel = function(lbl) {
        document.querySelector(".button.play-pause button").innerHTML=lbl||messages.PLAY_BUTTON_LABEL;
    };

    // const updateSwipeAngleThresholds = function() {
    //     swipeAngleMinThreshold=isMazeMode()?45:defaultSwipeAngleMinThreshold;
    //     swipeAngleMaxThreshold=isMazeMode()?45:defaultSwipeAngleMaxThreshold;
    // };

    const disableResetButton = function(isDisabled) {
        isDisabled=isDisabled===undefined;
        document.querySelector(".button.reset button").disabled=isDisabled;
    };

    const toggleHide = function(btn, hide) {
        document.querySelector(".button." + btn).classList[hide ? "add" : "remove"]("hide");
    };

    const setSpeed = function() {
        speed=calculateSpeed();
    };

    const calculateSpeed = function(lvl) {
        lvl=lvl || level;
        if(isChallengeMode()) {
            return classicModeBaseTime - ((reduction-20)*lvl);
        }
        if(isMazeMode()) {
            return baseTime - ((reduction-16)*lvl);
        }
        return baseTime - (reduction*lvl) + ((lvl >= 9) ? ((reduction/2) * (lvl-8)) : 0);
    };

    const calculateLevelUpPeriod = function() {
        return Math.round(Math.cbrt(southThreshold * eastThreshold));
    };

    const updateLevel = function(lvl) {
        level=lvl;
        levelNode.innerText=lvl;
    };

    const calculateMaxLevels = function() {
        let _speed;
        let lvl=1;
        for(;;lvl++) {
            _speed=calculateSpeed(lvl);
            if(isChallengeMode() && _speed===classicModeSpeedCutOff) {
                break;
            }
            else if(isMazeMode() && _speed===mazeModeSpeedCutOff) {
                break;
            }
            else if(isClassicMode() && _speed===speedCutOff) {
                break;
            }
        }
        maxLevel=lvl;
    };

    const setGameProgressFactor = function() {
        let maxProgressPercentage=100;
        if(isClassicMode()) {
            gameProgressFactor=maxProgressPercentage/(maxLevel*levelUpPeriod);
        }
        else if(isChallengeMode()) {
            let thresholds=predefinedThresholdsForChallengeMode();
            gameProgressFactor=maxProgressPercentage/(Math.pow(thresholds[1]-thresholds[0], 2));
        }
        else if(isMazeMode()) {
            let mazePathLength=document.querySelectorAll(".maze-path").length;
            gameProgressFactor=maxProgressPercentage/mazePathLength;
        }
    };

    const clearNodes = function() {
        nodes.concat(removeNodes).forEach(function (entry) {
            removePath(entry);
        });
        setTimeout(function() {
            nodes=[];
            removeNodes=[];
        }, 0);
    };

    const setRowColumnDirection = function() {
        row=southThreshold;
        //column=Math.round((eastThreshold+westThreshold)/2);
        column=westThreshold;
        setDirection(defaultDirection);
        movesQueue=[];
    };

    const updateRowColumnDirection = function() {
        if(isMazeMode()) {
            let startingNode;
            let data;

            if(gameState==="lifeLost") {
                startingNode=document.querySelector(".maze-path.head");
            }
            else {
                startingNode=document.querySelector(".maze-path.begin");
            }

            data=startingNode.getAttribute("data").split(",");
            row = +data[0];
            column = +data[1];
            setDirection(startingNode.getAttribute("direction"));

            if(direction==="north") {
                row++;
            }
            else if(direction==="south") {
                row--;
            }
            else if(direction==="east") {
                column--;
            }
            else if(direction==="west") {
                column++;
            }
            startingNode.classList.remove("nw","ne","se","sw","nw-ne","ne-se","se-sw","sw-nw");
        }
        else {
            setRowColumnDirection();
        }
    };

    const hideInstructions = function(flag) {
        flag=(flag===undefined) ? true : flag;
        document.querySelector('.instructions').classList.remove('show', 'hide');
        document.querySelector('.instructions').classList.add(flag ? 'hide' : 'show');
        !flag && updateModeLevels();
    };

    const nodeSelection = function(entry) {
        return entry && document.querySelector(".rc_" + entry[0] + "_" + entry[1]);
    };

    const addCrossHair = function(entry) {
        for(let index = 1; index <= columnsCount; index++) {
            addEntity([entry[0], index], "crosshair");
        }
        for(let index = 1; index <= rowsCount; index++) {
            addEntity([index, entry[1]], "crosshair");
        }
    };

    const removeCrossHair = function() {
        document.querySelectorAll(".crosshair").forEach(function(node) {
            node.classList.remove("crosshair");
            if(isClassicMode()) {
                node.classList.add("empty");
            }
        });
    };

    const addEntity = function(entry, entityType) {
        let node=nodeSelection(entry);
        if(node) {
            if(Object.prototype.toString.call(entityType)==="[object Array]") {
                entityType.forEach(function(entity) {
                    node.classList.add(entity);
                });
            }
            else {
                node.classList.add(entityType);
            }
            node.classList.remove("empty");
        }
    };

    const removeEntityFromNode = function(node, entityType) {
        if(node) {
            if(Object.prototype.toString.call(entityType)==="[object Array]") {
                entityType.forEach(function(entity) {
                    node.classList.remove(entity);
                });
            }
            else {
                node.classList.remove(entityType);
            }
            node.classList.add("empty");
        }
    };

    const removeEntity = function(entry, entityType) {
        // let node=nodeSelection(entry);
        removeEntityFromNode(nodeSelection(entry), entityType);
    };

    const removePath = function(entry) {
        if(entry!==undefined) {
            let node=nodeSelection(entry);
            if(node) {
                let wasTail=node.classList.contains("tail");
                node.classList.remove("path","head","body","tail","trail","nw","ne","se","sw","nw-ne","ne-se","se-sw","sw-nw");
                node.classList.add("empty");
                if(!isMazeMode() && wasTail && gameState==="play") {
                    node.classList.add("trail");
                }
            }
        }
    };

    const addPath = function() {
        for(let node, index=0; index < nodes.length; index++) {
            node=nodeSelection(nodes[index]);
            if(node) {
                node.classList.remove("empty","head","body","trail","nw-ne","ne-se","se-sw","sw-nw");
                node.classList.add("path", index===nodes.length - 1 ? "head" : "body");
                if(index===0) {
                    node.classList.add("tail");
                }
                if(index===nodes.length - 1) {
                    let headClass="";
                    if(direction==="north") {
                        headClass="nw-ne";
                    }
                    else if(direction==="east") {
                        headClass="ne-se";
                    }
                    else if(direction==="south") {
                        headClass="se-sw";
                    }
                    else if(direction==="west") {
                        headClass="sw-nw";
                    }
                    node.classList.add(headClass);
                }
            }
        }
    };

    const onValidPath = function(_coordinate, _selector) {
        let node=nodeSelection(_coordinate);
        if(node) {
            if(isMazeMode()) {
                // avoid deviation from maze path
                return node.classList.contains(_selector);
            }
            else {
                // avoid body collision
                return !node.classList.contains(_selector);
            }
        }
        return false;
    };

    const onValidMazePath = function(_coordinate) {
        let node=nodeSelection(_coordinate);
        if(node && isMazeMode()) {
            // avoid deviation from maze path
            return node.classList.contains("maze-path");
        }
        return true;
    };

    // PERSISTENCE METHODS
    const persistItem = function(key, value) {
        localStorage.setItem(key, value);
    };

    const retrieveItem = function(key) {
        return localStorage.getItem(key);
    };

    // LOGIC TO GENERATE FOOD
    const generateFood = function() {
        if(isMazeMode()) {
            return;
        }
        const emptyNodes=document.querySelectorAll(".game-arena-display div.empty:not(.head)");
        if(emptyNodes.length > 0) {
            let emptyNode=emptyNodes[Math.floor(Math.random() * emptyNodes.length)];
            let randomCoordinate=emptyNode.getAttribute("data").split(",");
            let entry=[+randomCoordinate[0], +randomCoordinate[1]];
            meals.push(entry.toString());
            addEntity(entry, "food");
            removeCrossHair();
            addCrossHair(entry);
        }
    };

    // LOGIC FOR FLICKER EFFECT
    const induceFlickerEffect = function(flickerCount) {
        flickerCount=flickerCount || 6;
        let paths=document.querySelectorAll(".path");
        flickerInterval=setInterval(function() {
            if(flickerCount===-1) {
                flickerInterval=clearInterval(flickerInterval);
                return;
            }
            paths.forEach(function (path) {
                path.classList[flickerCount % 2===0 ? "add" : "remove"]("flicker");
            });
            flickerCount--;
        }, 200);
    };

    // LOGIC TO INDUCE A PAUSE BEFORE CONTINUING
    const inducePause = function(milliseconds) {
       if(gameState!=="paused") {
            interval=clearInterval(interval);
            setGameState("paused");
        }
        let pauseInterval=setInterval(function() {
            setSpeedInterval();
            setGameState("play");
            pauseInterval=clearInterval(pauseInterval);
        }, milliseconds || 1500);
    };

    // LOGIC TO CHECK IF GAME IS OVER
    const checkGameOver = function() {
        if(isClassicMode() && speed < speedCutOff) {
            level--;
            gameOver(10, "Well done! :)", true);
            document.querySelectorAll(".food").forEach(function(node) {
               removeEntityFromNode(node, "food");
            });
            return true;
        }
//         if(isChallengeMode()) {
//             return document.querySelectorAll(".game-arena-display div.empty:not(.head)").length===0;
//         }
        return false;
    };

    // LOGIC TO SAVE GAME STATS
    const saveGameStats = function() {
        //time=time.toFixed(1);
        let stats=retrieveItem("snake-game-stats");
        let unlockedLevels=+retrieveItem("unlocked" + capitalize(selectedMode) + "Levels")||1;
        let value={
            "timestamp": (new Date().getTime()),
            "level": level,
            "score": score,
            //"time": time,
            "selectedMode": selectedMode
        };

        if(stats!==null) {
            stats=JSON.parse(stats);
            let found=stats.findIndex(function(stat) {
                return stat.score < score;
            });

            if(found!==-1) {
                stats.splice(found, 0, value);
            }
            else {
                stats.push(value);
            }
            persistItem("snake-game-stats", JSON.stringify(stats));
        }
        else {
            persistItem("snake-game-stats", JSON.stringify([value]));
        }

        // update unlockedLevels if current level is greater than already stored
        if((isClassicMode() && level > unlockedLevels) || incrementLevel) {
            incrementLevel=false;
            if(!isClassicMode()) {
                level++;
            }
            persistItem("unlocked" + capitalize(selectedMode) + "Levels", level);
        }

        updateLeaderboard();
    };

    // MAZE MODE METHODS
    // const randomMazeCoordinatesSelector = function() {
    //     selectedCoordinates=coordinates[Math.floor(Math.random() * 12)];
    //     return selectedCoordinates;
    // };

    const mazeCoordinatesSelector = function() {
        let selectedModeLevel=+retrieveItem("selected" + capitalize(selectedMode) + "Level")||1;
        selectedCoordinates=coordinates[selectedModeLevel-1];
        return selectedCoordinates;
    };

    const clearMazeModeUI = function() {
        // remove all decoration css classes and direction attribute added to the maze-path
        document.querySelectorAll(".maze-mode .maze-path").forEach(function(node) {
            node.removeAttribute("direction");
            node.classList.remove("maze-path", "north", "south", "east", "west", "begin", "end");
        });
        // remove css class maze-mode from game-arena-display
        document.querySelector(".game-arena-display").classList.remove("maze-mode");
    };

    const generateMazePath = function(gridDimension) {
        // proactively clear the maze path first
        clearMazeModeUI();

        document.querySelector(".game-arena-display").classList.add("maze-mode");
        gridDimension=gridDimension || rowsCount;
        mazeCoordinatesSelector();

        let dimension=Math.sqrt(selectedCoordinates.length);
        let factor=gridDimension/dimension;
        let prevCoordinate;
        let cls;
        let prevNode;
        let node;
        let bridgeNode;
        let row;
        let column;
        let prevRow;
        let prevColumn;
        let mazeCls="maze-path";
        let selectedCoordinatesCount=selectedCoordinates.length;
        let extract = function(coordinateValue) {
            return Math.round(((coordinateValue + 1) * factor) - 1);
        };

        selectedCoordinates.forEach(function(coordinate, index) {
            cls="";
            row=extract(coordinate[0]);
            column=extract(coordinate[1]);
            node=nodeSelection([row, column]);

            if(prevCoordinate) {
                if(prevCoordinate[0]>coordinate[0]) {
                    cls="north";
                }
                else if(prevCoordinate[0]<coordinate[0]) {
                    cls="south";
                }
                if(prevCoordinate[1]>coordinate[1]) {
                    cls="west";
                }
                else if(prevCoordinate[1]<coordinate[1]) {
                    cls="east";
                }

                prevRow=extract(prevCoordinate[0]);
                prevColumn=extract(prevCoordinate[1]);
                for(let i=1; i < factor; i++) {
                    if(cls==="north") {
                        prevRow--;
                    }
                    else if(cls==="south") {
                        prevRow++;
                    }
                    else if(cls==="east") {
                        prevColumn++;
                    }
                    else if(cls==="west") {
                        prevColumn--;
                    }
                    bridgeNode=nodeSelection([prevRow, prevColumn]);
                    bridgeNode.classList.add(mazeCls, cls);
                    // set a direction attribute
                    bridgeNode.setAttribute("direction", cls);
                }

                prevNode.classList.add(mazeCls);
                node.classList.add(mazeCls, cls);
                // set a direction attribute
                prevNode.setAttribute("direction", cls);
                if(index===1) {
                    prevNode.classList.add(cls);
                }
            }
            else {
                node.classList.add(mazeCls, "begin");
            }

            if(selectedCoordinatesCount===index+1) {
                node.classList.add("end", mazeCls);
            }
            prevCoordinate=coordinate;
            prevNode=node;
        });
    };

    const isImmersiveExperienceOn = function() {
        return document.querySelector("body").classList.contains("dark");
    };

    // CHALLENGE MODE METHODS
    const predefinedThresholdsForChallengeMode = function() {
        let selectedLevel=+retrieveItem("selected" + capitalize(selectedMode) + "Level")||1;
        let challengeLevelCoordinates;
        let immersiveExp = isImmersiveExperienceOn();
        if(selectedLevel <= 3) {
            if(immersiveExp) {
                challengeLevelCoordinates=[12,28];
            }
            else {
                challengeLevelCoordinates=[9,27];
            }
        }
        else if(selectedLevel > 3 && selectedLevel <= 6) {
            if(immersiveExp) {
                challengeLevelCoordinates=[10,30];
            }
            else {
                challengeLevelCoordinates=[6,30];
            }
        }
        else if(selectedLevel > 6 && selectedLevel <= 9) {
            if(immersiveExp) {
                challengeLevelCoordinates=[5,35];
            }
            else {
                challengeLevelCoordinates=[3,33];
            }
        }
        else {
            if(immersiveExp) {
                challengeLevelCoordinates=[0,40];
            }
            else {
                challengeLevelCoordinates=[0,36];
            }
        }
        totalRectsCountChallengeMode=Math.pow(challengeLevelCoordinates.reduce((a,b)=>b-a), 2);
        return challengeLevelCoordinates;
    };

    const updateGameArenaThresholds = function(thresholds) {
        // update the threshold limits
        northThreshold=thresholds[0]+1;
        westThreshold=thresholds[0]+1;
        eastThreshold=thresholds[1];
        southThreshold=thresholds[1];
        // update the starting coordinates and direction
        setRowColumnDirection();
    };

    const updateChallengeModeUI = function(thresholds) {
        thresholds = thresholds || predefinedThresholdsForChallengeMode();
        // proactively clear the classic mode first
        clearChallengeModeUI();

        // update game arena limits
        updateGameArenaThresholds(thresholds);

        document.querySelector(".game-arena-display").classList.add("challenge-mode");
        document.querySelectorAll(".empty").forEach(function(node) {
            let coordinate = node.getAttribute("data").split(",");
            if(+coordinate[0] <= thresholds[0] ||
                +coordinate[0] > thresholds[1] ||
                +coordinate[1] <= thresholds[0] ||
                +coordinate[1] > thresholds[1])
            {
                node.classList.remove("empty");
                node.classList.add("danger");
            }
        });
    };

    const clearChallengeModeUI = function() {
        updateGameArenaThresholds(baseThresholds);
        document.querySelectorAll(".danger").forEach(function(node) {
            node.classList.remove("danger");
            node.classList.add("empty");
        });
        document.querySelector(".game-arena-display").classList.remove("challenge-mode");
    };

    // EVENT HANDLERS
    const modeSelectionEventHandler = function(event) {
        event.stopPropagation();
        document.querySelector('.modes div.selected').classList.remove('selected');
        this.classList.add('selected');
        selectedMode=this.getAttribute("data");
        persistItem("selectedMode", selectedMode);
        // calculate the max levels possible for selected mode
        calculateMaxLevels();
        // clear the mode levels first
        clearModeLevels();
        addModeLevels();
        updateModeLevels();
        displayModeInstructions();
        if(isMazeMode()) {
            generateMazePath();
        }
        else {
            clearMazeModeUI();
        }
        if(isChallengeMode()) {
            updateChallengeModeUI();
        }
        else {
            clearChallengeModeUI();
        }
        setSnakeLength();
        updateLeaderboard();
        setGameProgressFactor();
        resetGameProgress();
        // updateSwipeAngleThresholds();
    };

    const levelSelectionEventHandler = function(event) {
        event.stopPropagation();
        document.querySelector('.levels div.selected').classList.remove('selected');
        this.classList.add('selected');
        let lvl=+this.getAttribute("data");
        persistItem("selected" + capitalize(selectedMode) + "Level", lvl);
        if(isMazeMode()) {
            generateMazePath();
        }
        if(isChallengeMode()) {
            updateChallengeModeUI();
        }
        setSnakeLength();
    };

    // SELECTION UI METHODS
    const addAvailableModes = function() {
        let levelsContainer=document.querySelector(".selectMode .modes");
        let div=document.createElement("DIV");
        let clone;

        availableModes.forEach(function(mode) {
            clone=div.cloneNode();
            clone.setAttribute("data", mode);
            clone.setAttribute("class", "mode");
            clone.innerText=mode;
            levelsContainer.appendChild(clone);
        });
    };

    const updateModes = function() {
        let unlockedModes=JSON.parse(retrieveItem("unlockedModes"))||[selectedMode];

        selectedMode=retrieveItem("selectedMode")||selectedMode;
        document.querySelectorAll(".selectMode .modes .mode").forEach(function(node) {
            let modeValue=node.getAttribute("data");
            // proactively remove click event listener and css classes
            node.removeEventListener(isPortableMode ? "touchstart" : "click", modeSelectionEventHandler);
            node.classList.remove("selected", "enabled", "disabled");
            // add click event listener
            node.addEventListener(isPortableMode ? "touchstart" : "click", modeSelectionEventHandler);
            if(modeValue===selectedMode) {
                node.classList.add("enabled", "selected");
            }
            else {
                if(unlockedModes.indexOf(modeValue.toLowerCase())===-1) {
                    node.classList.add("disabled");
                    // remove click event listener for disabled mode
                    node.removeEventListener(isPortableMode ? "touchstart" : "click", modeSelectionEventHandler);
                }
                else {
                    node.classList.add("enabled");
                }   
            }
        });

        if(isMazeMode()) {
            generateMazePath();
        }
        else if(isChallengeMode()) {
            updateChallengeModeUI();
        }
    };

    const clearModeLevels = function() {
        document.querySelectorAll(".selectLevel .levels .level").forEach(function(node) {
            node.remove();
        });
    };

    const addModeLevels = function() {
        let levelsContainer=document.querySelector(".selectLevel .levels");
        let div=document.createElement("DIV");
        let clone;

        for(let lvl=1; lvl<=maxLevel; lvl++) {
            clone=div.cloneNode();
            clone.setAttribute("data", lvl);
            clone.setAttribute("class", "level");
            clone.innerText=lvl;
            levelsContainer.appendChild(clone);
        }
    };

    const updateModeLevels = function() {
        let selectedLevel=+retrieveItem("selected" + capitalize(selectedMode) + "Level")||1;
        let unlockedLevels=+retrieveItem("unlocked" + capitalize(selectedMode) + "Levels")||1;

        document.querySelectorAll(".selectLevel .levels .level").forEach(function(node, index) {
            // proactively remove click event listener and css classes
            node.removeEventListener(isPortableMode ? "touchstart" : "click", levelSelectionEventHandler);
            node.classList.remove("selected", "enabled", "disabled");
            // add click event listener
            node.addEventListener(isPortableMode ? "touchstart" : "click", levelSelectionEventHandler);
            if(selectedLevel===index+1) {
                node.classList.add("enabled", "selected");
            }
            else {
                if(unlockedLevels < index+1) {
                    node.classList.add("disabled");
                    // remove click event listener for disabled level
                    node.removeEventListener(isPortableMode ? "touchstart" : "click", levelSelectionEventHandler);
                }
                else {
                    node.classList.add("enabled");
                }
            }
        });
    };

    const displayModeInstructions = function() {
        document.querySelectorAll(".instructions .details ol").forEach(function(node) {
            if(node.classList.contains(selectedMode + "-mode")) {
                node.classList.add("show");
                node.classList.remove("hide");
            }
            else {
                node.classList.remove("show");
                if(!node.classList.contains("hide")) {
                    node.classList.add("hide");
                }
            }
        });
    };

    // STATS AND TIMINGS DISPLAY
    const updateLeaderboard = function(limit) {
        limit=limit || 3;
        let leaderboard=document.querySelector(".leaderboard");
        let stats=JSON.parse(retrieveItem("snake-game-stats"));

        // if stats is not null, then filter stats based on the selected game mode
        if(stats!==null) {
            stats=stats.filter(function(stat) {
                return stat.selectedMode===selectedMode;
            });
        }

        // check if we have entries for the selected game mode after filtering
        if(stats && stats.length > 0) {
            let keys = Object.keys(stats[0]);
            let leaderBoardRow="<div class='row'>";
            //leaderBoardRow += "<div class='padded'></div>";
            leaderBoardRow += "<div class='column head'>S.No</div>";
            keys.forEach(function(key) {
                if(key!=="timestamp" && key!=="time") {
                    leaderBoardRow += "<div class='column head'>" + key + "</div>";
//                     leaderBoardRow += "<div class='column head'>";
//                     if(key!=="timestamp") {
//                         leaderBoardRow += key;
//                     }
//                     else {
//                         leaderBoardRow += "played on";
//                     }
//                     leaderBoardRow +=  "</div>";
                }
            });
            //leaderBoardRow += "<div class='padded'></div>";
            leaderBoardRow += "</div>";

            for(let stat, index=0; index < limit; index++) {
                stat=stats[index];
                if(stat) {
                    leaderBoardRow += "<div class='row'>";
                    //leaderBoardRow += "<div class='padded'></div>";
                    leaderBoardRow += "<div class='column'>" + (index+1) + ".</div>";
                    keys.forEach(function(key) {
                        if(key!=="timestamp" && key!=="time") {
                            leaderBoardRow += "<div class='column'>" + stat[key] + "</div>";
//                             leaderBoardRow += "<div class='column'>";
//                             if(key!=="timestamp") {
//                                 leaderBoardRow += stat[key];
//                             }
//                             else {
//                                 let dt = new Date(stat[key]);
//                                 leaderBoardRow += dt.getFullYear() + "-" + (dt.getMonth()+1 < 10 ? "0" :  dt.getMonth()+1) + "-" + dt.getDate();
//                             }
//                             leaderBoardRow +=  "</div>";
                        }
                    });
                    //leaderBoardRow += "<div class='padded'></div>";
                    leaderBoardRow += "</div>";
                }
            }
            leaderboard.innerHTML=leaderBoardRow;
        }
        else {
            leaderboard.innerHTML="<div class='message'>" + messages.TOP_3_SCORES + "</div>";
        }
    };

    // LOGIC FOR GAME OVER
    const gameOver = function(count, msg, bypassSnakeLife) {
        bypassSnakeLife=(bypassSnakeLife===undefined) ? false : bypassSnakeLife;
        interval=clearInterval(interval);
        timerInterval=clearInterval(timerInterval);
        scoreInterval=clearInterval(scoreInterval);
        induceFlickerEffect(count);

        if(isMazeMode() && document.querySelector(".maze-mode .head").classList.contains("end")) {
            bypassSnakeLife=true;
            msg=constructMessage();
            // update games stats once the maze is completed successfully
            saveGameStats();
        }

        if(!bypassSnakeLife && snakeLife > 1) {
            loseLife();
            setGameState("lifeLost");
            updateMessage(snakeLife + messages.SPACE
                + (snakeLife===1 ? messages.LIFE_REMAINING : messages.LIVES_REMAINING)
                + messages.SPACE + messages.RESUME);
            updateActionButtonLabel(messages.PLAY_BUTTON_LABEL);
        }
        else {
            setGameState("over");
            updateLife();
            updateMessage(msg||(messages.GAME_OVER + messages.SPACE + messages.RESET));
            isPortableMode && toggleHide("play-pause", true);
            // specific check for maze mode as we want to update the game stats only when maze is completed successfully
            !isMazeMode() && saveGameStats();
        }
        isPortableMode && disableResetButton(false);
    };

    // SNAKE MOVE LOGIC
    const moveSnake = function() {
        let onValidPathCls=(isMazeMode() ? "maze-path" : "body");
        if(direction==="north") {
            if(nodes.length < snakeLength) {
                if(row > northThreshold && onValidMazePath([row-1, column])) {
                    if(nodes.length > 0) {
                        nodes.push([--row, column]);
                    }
                    else {
                        row=row - (row===southThreshold ? 0 : 1);
                        nodes.push([row, column]);
                    }
                }
                else {
                    gameOver(7);
                    return;
                }
                // useful for maze-mode
                if(onValidPath([row, column], onValidPathCls)) {
                    removePath(removeNodes.shift());
                    addPath();
                }
                else {
                    gameOver(7);
                    return;
                }
            }
            else {
                removeNodes.push(nodes.shift());
                if(row > northThreshold && onValidPath([row-1, column], onValidPathCls)) {
                    nodes.push([--row, column]);
                    // useful for maze-mode
                    if(onValidPath([row, column], onValidPathCls)) {
                        removePath(removeNodes.shift());
                        addPath();
                    }
                    else {
                        gameOver(7);
                        return;
                    }
                }
                else {
                    gameOver(7);
                    return;
                }
            }
        }
        else if(direction==="south") {
            if(nodes.length < snakeLength) {
                if(row < southThreshold && onValidMazePath([row+1, column])) {
                    if(nodes.length > 0) {
                        nodes.push([++row, column]);
                    }
                    else {
                        row=row+(row===southThreshold ? 0 : 1);
                        nodes.push([row, column]);
                    }
                }
                else {
                    gameOver(7);
                    return;
                }
                // useful for maze-mode
                if(onValidPath([row, column], onValidPathCls)) {
                    removePath(removeNodes.shift());
                    addPath();
                }
                else {
                    gameOver(7);
                    return;
                }
            }
            else {
                removeNodes.push(nodes.shift());
                if(row < southThreshold && onValidPath([row+1, column], onValidPathCls)) {
                    nodes.push([++row, column]);
                    // useful for maze-mode
                    if(onValidPath([row, column], onValidPathCls)) {
                        removePath(removeNodes.shift());
                        addPath();
                    }
                    else {
                        gameOver(7);
                        return;
                    }
                }
                else {
                    gameOver(7);
                    return;
                }
            }
        }
        else if(direction==="east") {
            if(nodes.length < snakeLength) {
                if(column < eastThreshold && onValidMazePath([row, column+1])) {
                    if(nodes.length > 0) {
                        nodes.push([row, ++column]);
                    }
                    else {
                        column=column+(column===eastThreshold ? 0 : 1);
                        nodes.push([row, column]);
                    }
                }
                else {
                    gameOver(7);
                    return;
                }
                // useful for maze-mode
                if(onValidPath([row, column], onValidPathCls)) {
                    removePath(removeNodes.shift());
                    addPath();
                }
                else {
                    gameOver(7);
                    return;
                }
            }
            else {
                removeNodes.push(nodes.shift());
                if(column < eastThreshold && onValidPath([row, column+1], onValidPathCls)) {
                    nodes.push([row, ++column]);
                    // useful for maze-mode
                    if(onValidPath([row, column], onValidPathCls)) {
                        removePath(removeNodes.shift());
                        addPath();
                    }
                    else {
                        gameOver(7);
                        return;
                    }
                }
                else {
                    gameOver(7);
                    return;
                }
            }
        }
        else if(direction==="west") {
            if(nodes.length < snakeLength) {
                if(column > westThreshold && onValidMazePath([row, column-1])) {
                    if(nodes.length > 0) {
                        nodes.push([row, --column]);
                    }
                    else {
                        column=column-(column===westThreshold ? 0 : 1);
                        nodes.push([row, column]);
                    }
                }
                else {
                    gameOver(7);
                    return;
                }
                // useful for maze-mode
                if(onValidPath([row, column], onValidPathCls)) {
                    removePath(removeNodes.shift());
                    addPath();
                }
                else {
                    gameOver(7);
                    return;
                }
            }
            else {
                removeNodes.push(nodes.shift());
                if(column > westThreshold && onValidPath([row, column-1], onValidPathCls)) {
                    nodes.push([row, --column]);
                    // useful for maze-mode
                    if(onValidPath([row, column], onValidPathCls)) {
                        removePath(removeNodes.shift());
                        addPath();
                    }
                    else {
                        gameOver(7);
                        return;
                    }
                }
                else {
                    gameOver(7);
                    return;
                }
            }
        }
        updateGameStatus();
        updateGameProgress();
        // increment the count of maze path traversed
        isMazeMode() && mazePathTraversed++;
        // increment the count of challenge arena covered
        if(isChallengeMode()) {
            if(document.querySelectorAll(".game-arena-display div.path").length===totalRectsCountChallengeMode) {
                gameOver(10, constructMessage(), true);
            }
        }
    };

    const constructMessage = function() {
        let msg;
        let selectedLevel=+retrieveItem("selected" + capitalize(selectedMode) + "Level")||1;
        let unlockedLevels=+retrieveItem("unlocked" + capitalize(selectedMode) + "Levels")||1;

        if(selectedLevel===unlockedLevels && selectedLevel<maxLevel) {
            msg=messages.CONGRATULATIONS + messages.COMMA
                + messages.LEVEL_UNLOCKED + messages.SPACE
                + messages.RESET;
            incrementLevel=true;
        }
        else if(selectedLevel < unlockedLevels) {
            msg=messages.CONGRATULATIONS + messages.EXCLAMATION + messages.SPACE + messages.RESET;
        }
        else {
            msg=messages.AMAZING + messages.COMMA
                + messages.ALL_LEVELS_COMPLETED + messages.SPACE
                + messages.RESET;
        }
        return msg;
    };

    const triggerLevelUp = function() {
        const levelUpValueNode=document.querySelector(".level .value");
        let lvlUpPixel=1.9;
        const levelUpInterval=setInterval(function() {
            lvlUpPixel+=.1;
            levelUpValueNode.style.background="repeating-radial-gradient(orange, transparent " + lvlUpPixel + "px)";
            if(lvlUpPixel>15) {
                levelUpValueNode.style.background="";
                clearInterval(levelUpInterval);
            }
        }, 20);
    };

    // LOGIC TO UPDATE THE STATE OF GAME
    const updateGameStatus = function() {
        let mealIndex;
        let dangerIndex;
        let currentLocation=[row, column];

        mealIndex=meals.indexOf(currentLocation.toString());
        if(mealIndex!==-1) {
            meals.splice(mealIndex,1);
            removeEntity(currentLocation, "food");
            updateScore();
            generateFood();
            snakeLength+=(isChallengeMode()?5:1);

            if(isClassicMode() && snakeLength % levelUpPeriod===0) {
                levelNode.innerText=++level;
                setSpeed();
                if(!checkGameOver(speed)) {
                    inducePause(100);
                    triggerLevelUp();
                }
                else {
                    levelNode.innerText=level;
                }
            }
            return;
        }

        dangerIndex=dangers.indexOf(currentLocation.toString());
        if(dangerIndex!==-1) {
            loseLife();
            dangers.splice(dangerIndex,1);
            removeEntity(currentLocation, "danger");
            induceFlickerEffect();
            inducePause();
            if(snakeLife===0) {
                gameOver();
            }
        }
    };

    // LOGIC FOR UPDATING GAME PROGRESS BAR
    const updateGameProgress = function() {
        gameProgressBar.style.borderColor="#00ff0d"; // green
        gameProgressBar.style.background="#00ff0d"; // green
        if(isClassicMode() && snakeLength > 3) {
            gameProgressBar.style.width=(gameProgressFactor*snakeLength) + "%";
            return;
        }
        if(isChallengeMode()) {
            gameProgressBar.style.width=(gameProgressFactor*document.querySelectorAll(".game-arena-display div.path").length) + "%";
            return;
        }
        if(isMazeMode()) {
            // maintain a maze path traversed count
            gameProgressBar.style.width=(gameProgressFactor*mazePathTraversed) + "%";
        }
    };

    // LOGIC TO RESET GAME PROGRESS BAR
    const resetGameProgress = function() {
        gameProgressBar.style.width="0px";
        gameProgressBar.style.borderColor="transparent";
        gameProgressBar.style.background="transparent";
        if(isMazeMode()) {
            mazePathTraversed=0;
        }
    };

    // SET UP THE GAME
	const init = function() {
		persistItem("unlockedModes", JSON.stringify(unlockedModes));
		// selectedMode is important to be decided first as other calculations are dependent on it
		selectedMode=retrieveItem("selectedMode")||selectedMode;
		updateLevel(+retrieveItem("selected" + capitalize(selectedMode) + "Level") || 1);
		calculateMaxLevels();
		setSnakeLength();
		setupArena();
		addAvailableModes();
		updateModes();
		addModeLevels();
		updateModeLevels();
		displayModeInstructions();
		updateLeaderboard();
		// updateSwipeAngleThresholds();
		setGameProgressFactor();
	};

    // predefined set of 12x12 dimension Hamiltonian paths for the maze mode
	coordinates=[
        [[1,7],[2,7],[2,8],[2,9],[3,9],[3,10],[4,10],[4,9],[4,8],[3,8],[3,7],[3,6],[4,6],[4,7],[5,7],[5,8],[5,9],[5,10],[5,11],[6,11],[7,11],[8,11],[9,11],[9,10],[10,10],[10,11],[11,11],[11,10],[11,9],[10,9],[9,9],[9,8],[8,8],[8,7],[8,6],[7,6],[7,7],[7,8],[7,9],[8,9],[8,10],[7,10],[6,10],[6,9],[6,8],[6,7],[6,6],[5,6],[5,5],[6,5],[6,4],[6,3],[7,3],[8,3],[8,4],[7,4],[7,5],[8,5],[9,5],[9,6],[9,7],[10,7],[10,8],[11,8],[11,7],[11,6],[10,6],[10,5],[11,5],[11,4],[10,4],[9,4],[9,3],[10,3],[11,3],[11,2],[10,2],[9,2],[9,1],[10,1],[11,1],[11,0],[10,0],[9,0],[8,0],[7,0],[7,1],[8,1],[8,2],[7,2],[6,2],[6,1],[6,0],[5,0],[4,0],[3,0],[3,1],[4,1],[5,1],[5,2],[4,2],[3,2],[2,2],[1,2],[1,1],[2,1],[2,0],[1,0],[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[1,5],[1,4],[1,3],[2,3],[2,4],[3,4],[3,3],[4,3],[5,3],[5,4],[4,4],[4,5],[3,5],[2,5],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[1,9],[0,9],[0,10],[0,11],[1,11],[1,10],[2,10],[2,11],[3,11],[4,11]],
        [[9,1],[10,1],[10,2],[11,2],[11,1],[11,0],[10,0],[9,0],[8,0],[7,0],[6,0],[5,0],[5,1],[6,1],[6,2],[5,2],[4,2],[4,3],[3,3],[3,2],[3,1],[4,1],[4,0],[3,0],[2,0],[2,1],[1,1],[1,0],[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,6],[1,7],[0,7],[0,8],[0,9],[1,9],[1,8],[2,8],[2,9],[2,10],[1,10],[0,10],[0,11],[1,11],[2,11],[3,11],[3,10],[4,10],[4,11],[5,11],[5,10],[6,10],[6,11],[7,11],[8,11],[9,11],[9,10],[9,9],[8,9],[8,10],[7,10],[7,9],[6,9],[5,9],[5,8],[6,8],[7,8],[7,7],[6,7],[5,7],[5,6],[5,5],[4,5],[4,6],[4,7],[4,8],[4,9],[3,9],[3,8],[3,7],[2,7],[2,6],[3,6],[3,5],[2,5],[1,5],[1,4],[1,3],[1,2],[2,2],[2,3],[2,4],[3,4],[4,4],[5,4],[5,3],[6,3],[6,4],[6,5],[6,6],[7,6],[7,5],[7,4],[8,4],[8,3],[7,3],[7,2],[7,1],[8,1],[8,2],[9,2],[9,3],[10,3],[11,3],[11,4],[11,5],[10,5],[10,4],[9,4],[9,5],[8,5],[8,6],[8,7],[8,8],[9,8],[10,8],[10,9],[10,10],[10,11],[11,11],[11,10],[11,9],[11,8],[11,7],[11,6],[10,6],[10,7],[9,7],[9,6]],
        [[1,11],[0,11],[0,10],[0,9],[0,8],[0,7],[0,6],[0,5],[0,4],[0,3],[0,2],[0,1],[0,0],[1,0],[2,0],[3,0],[3,1],[4,1],[4,0],[5,0],[5,1],[5,2],[4,2],[3,2],[2,2],[2,1],[1,1],[1,2],[1,3],[2,3],[3,3],[4,3],[5,3],[5,4],[5,5],[5,6],[6,6],[6,5],[7,5],[8,5],[8,4],[7,4],[6,4],[6,3],[6,2],[7,2],[7,3],[8,3],[8,2],[9,2],[10,2],[10,1],[9,1],[8,1],[7,1],[6,1],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[11,1],[11,2],[11,3],[11,4],[11,5],[10,5],[10,4],[10,3],[9,3],[9,4],[9,5],[9,6],[9,7],[8,7],[8,6],[7,6],[7,7],[7,8],[8,8],[9,8],[10,8],[10,7],[10,6],[11,6],[11,7],[11,8],[11,9],[10,9],[10,10],[11,10],[11,11],[10,11],[9,11],[9,10],[9,9],[8,9],[8,10],[8,11],[7,11],[6,11],[5,11],[4,11],[3,11],[2,11],[2,10],[1,10],[1,9],[1,8],[1,7],[1,6],[1,5],[1,4],[2,4],[2,5],[2,6],[2,7],[3,7],[3,8],[2,8],[2,9],[3,9],[3,10],[4,10],[4,9],[4,8],[5,8],[5,9],[5,10],[6,10],[7,10],[7,9],[6,9],[6,8],[6,7],[5,7],[4,7],[4,6],[3,6],[3,5],[4,5],[4,4],[3,4]],
        [[5,1],[6,1],[7,1],[8,1],[8,2],[9,2],[9,1],[9,0],[8,0],[7,0],[6,0],[5,0],[4,0],[3,0],[2,0],[2,1],[1,1],[1,0],[0,0],[0,1],[0,2],[1,2],[1,3],[0,3],[0,4],[1,4],[1,5],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[1,11],[2,11],[3,11],[4,11],[5,11],[5,10],[4,10],[4,9],[3,9],[3,10],[2,10],[1,10],[1,9],[2,9],[2,8],[1,8],[1,7],[1,6],[2,6],[2,5],[2,4],[3,4],[3,3],[2,3],[2,2],[3,2],[3,1],[4,1],[4,2],[5,2],[5,3],[4,3],[4,4],[4,5],[3,5],[3,6],[4,6],[5,6],[6,6],[6,5],[5,5],[5,4],[6,4],[6,3],[6,2],[7,2],[7,3],[7,4],[7,5],[8,5],[8,4],[8,3],[9,3],[9,4],[9,5],[10,5],[10,4],[10,3],[10,2],[10,1],[10,0],[11,0],[11,1],[11,2],[11,3],[11,4],[11,5],[11,6],[10,6],[10,7],[11,7],[11,8],[11,9],[11,10],[11,11],[10,11],[9,11],[9,10],[10,10],[10,9],[10,8],[9,8],[9,9],[8,9],[8,8],[8,7],[9,7],[9,6],[8,6],[7,6],[7,7],[7,8],[7,9],[7,10],[8,10],[8,11],[7,11],[6,11],[6,10],[6,9],[5,9],[5,8],[6,8],[6,7],[5,7],[4,7],[4,8],[3,8],[3,7],[2,7]],
        [[11,11],[11,10],[11,9],[11,8],[11,7],[11,6],[11,5],[10,5],[10,6],[10,7],[10,8],[10,9],[9,9],[9,8],[9,7],[9,6],[9,5],[8,5],[7,5],[7,6],[8,6],[8,7],[7,7],[7,8],[8,8],[8,9],[8,10],[9,10],[10,10],[10,11],[9,11],[8,11],[7,11],[7,10],[7,9],[6,9],[6,10],[6,11],[5,11],[5,10],[5,9],[5,8],[6,8],[6,7],[5,7],[5,6],[6,6],[6,5],[6,4],[7,4],[8,4],[9,4],[9,3],[10,3],[10,4],[11,4],[11,3],[11,2],[11,1],[11,0],[10,0],[9,0],[8,0],[8,1],[9,1],[10,1],[10,2],[9,2],[8,2],[8,3],[7,3],[7,2],[6,2],[6,3],[5,3],[5,2],[4,2],[3,2],[3,1],[4,1],[5,1],[6,1],[7,1],[7,0],[6,0],[5,0],[4,0],[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[1,2],[1,1],[2,1],[2,2],[2,3],[3,3],[4,3],[4,4],[5,4],[5,5],[4,5],[4,6],[4,7],[4,8],[4,9],[3,9],[2,9],[2,10],[3,10],[4,10],[4,11],[3,11],[2,11],[1,11],[0,11],[0,10],[1,10],[1,9],[0,9],[0,8],[0,7],[0,6],[0,5],[0,4],[0,3],[1,3],[1,4],[1,5],[1,6],[1,7],[1,8],[2,8],[3,8],[3,7],[2,7],[2,6],[2,5],[2,4],[3,4],[3,5],[3,6]],
        [[2,2],[3,2],[3,3],[4,3],[4,2],[5,2],[5,3],[6,3],[6,2],[7,2],[7,3],[8,3],[8,2],[9,2],[9,3],[10,3],[10,4],[10,5],[9,5],[9,4],[8,4],[7,4],[6,4],[5,4],[4,4],[3,4],[3,5],[4,5],[5,5],[5,6],[4,6],[4,7],[4,8],[4,9],[4,10],[3,10],[3,11],[4,11],[5,11],[6,11],[6,10],[5,10],[5,9],[5,8],[5,7],[6,7],[7,7],[7,6],[6,6],[6,5],[7,5],[8,5],[8,6],[8,7],[8,8],[7,8],[6,8],[6,9],[7,9],[7,10],[7,11],[8,11],[8,10],[8,9],[9,9],[9,10],[9,11],[10,11],[11,11],[11,10],[10,10],[10,9],[11,9],[11,8],[11,7],[10,7],[10,8],[9,8],[9,7],[9,6],[10,6],[11,6],[11,5],[11,4],[11,3],[11,2],[10,2],[10,1],[11,1],[11,0],[10,0],[9,0],[9,1],[8,1],[8,0],[7,0],[7,1],[6,1],[6,0],[5,0],[5,1],[4,1],[4,0],[3,0],[3,1],[2,1],[2,0],[1,0],[0,0],[0,1],[1,1],[1,2],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[1,7],[2,7],[2,8],[1,8],[0,8],[0,9],[1,9],[1,10],[0,10],[0,11],[1,11],[2,11],[2,10],[2,9],[3,9],[3,8],[3,7],[3,6],[2,6],[1,6],[1,5],[1,4],[1,3],[2,3],[2,4],[2,5]],
        [[2,0],[1,0],[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[1,3],[1,2],[1,1],[2,1],[3,1],[3,0],[4,0],[4,1],[4,2],[3,2],[2,2],[2,3],[3,3],[3,4],[2,4],[2,5],[3,5],[4,5],[4,6],[5,6],[6,6],[6,7],[7,7],[7,6],[7,5],[6,5],[5,5],[5,4],[4,4],[4,3],[5,3],[5,2],[5,1],[5,0],[6,0],[7,0],[8,0],[8,1],[8,2],[8,3],[7,3],[7,2],[7,1],[6,1],[6,2],[6,3],[6,4],[7,4],[8,4],[9,4],[10,4],[10,5],[9,5],[8,5],[8,6],[9,6],[10,6],[10,7],[9,7],[8,7],[8,8],[7,8],[6,8],[5,8],[5,7],[4,7],[3,7],[3,6],[2,6],[2,7],[2,8],[1,8],[1,7],[1,6],[1,5],[0,5],[0,6],[0,7],[0,8],[0,9],[1,9],[2,9],[3,9],[3,8],[4,8],[4,9],[4,10],[3,10],[2,10],[1,10],[0,10],[0,11],[1,11],[2,11],[3,11],[4,11],[5,11],[6,11],[6,10],[5,10],[5,9],[6,9],[7,9],[8,9],[9,9],[9,8],[10,8],[10,9],[10,10],[9,10],[8,10],[7,10],[7,11],[8,11],[9,11],[10,11],[11,11],[11,10],[11,9],[11,8],[11,7],[11,6],[11,5],[11,4],[11,3],[10,3],[9,3],[9,2],[10,2],[11,2],[11,1],[11,0],[10,0],[10,1],[9,1],[9,0]],
        [[4,2],[4,1],[4,0],[3,0],[2,0],[2,1],[3,1],[3,2],[2,2],[1,2],[1,1],[1,0],[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[1,3],[2,3],[2,4],[3,4],[3,3],[4,3],[4,4],[5,4],[6,4],[7,4],[7,5],[8,5],[8,4],[8,3],[7,3],[7,2],[7,1],[6,1],[6,2],[6,3],[5,3],[5,2],[5,1],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[11,1],[11,2],[10,2],[10,1],[9,1],[8,1],[8,2],[9,2],[9,3],[10,3],[11,3],[11,4],[10,4],[9,4],[9,5],[10,5],[11,5],[11,6],[10,6],[9,6],[8,6],[7,6],[7,7],[6,7],[5,7],[5,6],[6,6],[6,5],[5,5],[4,5],[4,6],[4,7],[4,8],[5,8],[5,9],[4,9],[4,10],[5,10],[6,10],[6,9],[6,8],[7,8],[8,8],[8,7],[9,7],[9,8],[10,8],[10,7],[11,7],[11,8],[11,9],[10,9],[9,9],[8,9],[7,9],[7,10],[8,10],[9,10],[10,10],[11,10],[11,11],[10,11],[9,11],[8,11],[7,11],[6,11],[5,11],[4,11],[3,11],[2,11],[2,10],[3,10],[3,9],[2,9],[1,9],[1,8],[2,8],[3,8],[3,7],[2,7],[2,6],[3,6],[3,5],[2,5],[1,5],[0,5],[0,6],[1,6],[1,7],[0,7],[0,8],[0,9],[0,10],[0,11],[1,11],[1,10]],
        [[1,7],[1,8],[2,8],[2,7],[3,7],[3,8],[3,9],[4,9],[4,8],[4,7],[5,7],[5,6],[4,6],[3,6],[2,6],[2,5],[3,5],[4,5],[4,4],[3,4],[2,4],[1,4],[1,3],[1,2],[1,1],[2,1],[2,2],[2,3],[3,3],[3,2],[3,1],[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[1,5],[1,6],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[1,11],[1,10],[1,9],[2,9],[2,10],[2,11],[3,11],[3,10],[4,10],[4,11],[5,11],[5,10],[5,9],[5,8],[6,8],[6,9],[6,10],[6,11],[7,11],[7,10],[7,9],[8,9],[8,10],[8,11],[9,11],[9,10],[9,9],[10,9],[10,10],[10,11],[11,11],[11,10],[11,9],[11,8],[11,7],[11,6],[10,6],[10,7],[10,8],[9,8],[8,8],[7,8],[7,7],[6,7],[6,6],[7,6],[8,6],[8,7],[9,7],[9,6],[9,5],[10,5],[11,5],[11,4],[10,4],[9,4],[9,3],[8,3],[7,3],[7,2],[8,2],[9,2],[9,1],[10,1],[10,2],[10,3],[11,3],[11,2],[11,1],[11,0],[10,0],[9,0],[8,0],[8,1],[7,1],[7,0],[6,0],[5,0],[4,0],[4,1],[4,2],[4,3],[5,3],[5,2],[5,1],[6,1],[6,2],[6,3],[6,4],[5,4],[5,5],[6,5],[7,5],[7,4],[8,4],[8,5]],
        [[4,10],[3,10],[2,10],[1,10],[1,9],[1,8],[2,8],[2,9],[3,9],[3,8],[4,8],[4,9],[5,9],[5,10],[6,10],[6,9],[6,8],[5,8],[5,7],[4,7],[3,7],[2,7],[1,7],[1,6],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[1,11],[2,11],[3,11],[4,11],[5,11],[6,11],[7,11],[8,11],[8,10],[7,10],[7,9],[7,8],[8,8],[8,9],[9,9],[10,9],[10,10],[9,10],[9,11],[10,11],[11,11],[11,10],[11,9],[11,8],[11,7],[10,7],[10,8],[9,8],[9,7],[8,7],[7,7],[6,7],[6,6],[5,6],[4,6],[3,6],[2,6],[2,5],[3,5],[4,5],[5,5],[5,4],[4,4],[3,4],[2,4],[2,3],[1,3],[1,4],[1,5],[0,5],[0,4],[0,3],[0,2],[1,2],[1,1],[0,1],[0,0],[1,0],[2,0],[2,1],[2,2],[3,2],[3,3],[4,3],[4,2],[4,1],[3,1],[3,0],[4,0],[5,0],[5,1],[6,1],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[11,1],[11,2],[11,3],[11,4],[11,5],[11,6],[10,6],[10,5],[10,4],[10,3],[10,2],[10,1],[9,1],[8,1],[7,1],[7,2],[6,2],[5,2],[5,3],[6,3],[7,3],[8,3],[8,2],[9,2],[9,3],[9,4],[9,5],[9,6],[8,6],[7,6],[7,5],[6,5],[6,4],[7,4],[8,4],[8,5]],
        [[4,0],[5,0],[5,1],[5,2],[5,3],[4,3],[3,3],[3,4],[4,4],[5,4],[5,5],[4,5],[4,6],[5,6],[6,6],[6,7],[7,7],[7,6],[8,6],[8,5],[7,5],[6,5],[6,4],[7,4],[8,4],[8,3],[8,2],[8,1],[7,1],[7,2],[7,3],[6,3],[6,2],[6,1],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[11,1],[10,1],[9,1],[9,2],[10,2],[11,2],[11,3],[10,3],[9,3],[9,4],[9,5],[9,6],[9,7],[8,7],[8,8],[9,8],[9,9],[8,9],[7,9],[7,8],[6,8],[6,9],[6,10],[7,10],[8,10],[9,10],[10,10],[10,9],[10,8],[10,7],[10,6],[10,5],[10,4],[11,4],[11,5],[11,6],[11,7],[11,8],[11,9],[11,10],[11,11],[10,11],[9,11],[8,11],[7,11],[6,11],[5,11],[5,10],[5,9],[5,8],[5,7],[4,7],[3,7],[3,8],[4,8],[4,9],[3,9],[3,10],[4,10],[4,11],[3,11],[2,11],[2,10],[2,9],[1,9],[1,10],[1,11],[0,11],[0,10],[0,9],[0,8],[0,7],[0,6],[0,5],[0,4],[1,4],[1,5],[1,6],[1,7],[1,8],[2,8],[2,7],[2,6],[3,6],[3,5],[2,5],[2,4],[2,3],[1,3],[0,3],[0,2],[1,2],[1,1],[0,1],[0,0],[1,0],[2,0],[3,0],[3,1],[2,1],[2,2],[3,2],[4,2],[4,1]],
        [[10,10],[9,10],[8,10],[7,10],[7,11],[8,11],[9,11],[10,11],[11,11],[11,10],[11,9],[11,8],[11,7],[11,6],[11,5],[11,4],[10,4],[10,5],[10,6],[10,7],[10,8],[10,9],[9,9],[9,8],[8,8],[8,9],[7,9],[6,9],[6,10],[6,11],[5,11],[4,11],[4,10],[5,10],[5,9],[4,9],[3,9],[3,10],[3,11],[2,11],[2,10],[1,10],[1,11],[0,11],[0,10],[0,9],[0,8],[1,8],[1,9],[2,9],[2,8],[3,8],[3,7],[3,6],[4,6],[4,7],[4,8],[5,8],[6,8],[7,8],[7,7],[8,7],[9,7],[9,6],[8,6],[8,5],[9,5],[9,4],[8,4],[7,4],[7,5],[7,6],[6,6],[6,7],[5,7],[5,6],[5,5],[6,5],[6,4],[5,4],[5,3],[4,3],[3,3],[3,4],[4,4],[4,5],[3,5],[2,5],[1,5],[1,6],[2,6],[2,7],[1,7],[0,7],[0,6],[0,5],[0,4],[0,3],[0,2],[0,1],[0,0],[1,0],[2,0],[2,1],[1,1],[1,2],[1,3],[1,4],[2,4],[2,3],[2,2],[3,2],[3,1],[3,0],[4,0],[4,1],[4,2],[5,2],[5,1],[6,1],[7,1],[8,1],[8,2],[7,2],[6,2],[6,3],[7,3],[8,3],[9,3],[9,2],[9,1],[10,1],[10,2],[10,3],[11,3],[11,2],[11,1],[11,0],[10,0],[9,0],[8,0],[7,0],[6,0],[5,0]]
    ];

	// initialize the game
	init();
})();
