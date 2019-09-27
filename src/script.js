/**
 * @author: Kapil Kashyap
 */
(function() {
    // DEFAULT SETTINGS
    var row;
    var column;
    var snakeLength=3;
    var snakeLife=3;
    var direction="north";
    var directionChanged=false;

    // INTERNAL VARIABLES
    var interval;
    var timerInterval;
    var scoreInterval;
    var flickerInterval;
    var nodes=[];
    var removeNodes=[];
    var meals=[];
    var dangers=[];
    var coordinates;
    var selectedCoordinates;

    // SPEED SETTINGS
    var baseTime=440;
    var speedCutOff=40;
    var classicModeBaseTime=340;//240;
    var classicModeSpeedCutOff=100;//60
    var mazeModeSpeedCutOff=152;
    var reduction=40;
    var speed;

    // THRESHOLDS
    var baseThresholds=[];
    var northThreshold;
    var westThreshold;
    var eastThreshold;
    var southThreshold;

    // MODES
    var availableModes=['classic', 'challenge', 'maze'];
    var unlockedModes=['classic', 'challenge', 'maze'];
    var selectedMode='classic';

    // SWIPE VARIABLES
    var startX;
    var startY;
    var distX;
    var distY;
    var elapsedTime;
    var startTime;
    var threshold=25; //required min distance traveled to be considered swipe
    var restraint=100; // maximum distance allowed at the same time in perpendicular direction
    var allowedTime=300; // maximum time allowed to travel that distance

    // GAME CONFIG
    var gameState;
    var levelUpPeriod;
    var maxLevel;
    var mazePathTraversed=0;
    var gameProgressFactor;
    var gameProgressBar=document.querySelector(".game-indicator .progress-bar");
    var level=1;
    var levelNode=document.querySelector(".level>.value");
    var score=0;
    var scoreNode=document.querySelector(".score>.value");
    var time=0.0;
    var timerNode=document.querySelector(".time>.value");
    var isPortableMode=(function() {
        if( /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent) ) {
            document.body.style.zoom="200%";
            setTimeout(function() {
                document.querySelector(".desktop-message").innerHTML=messages.DISCLAIMER;
            }, 0);
            return true;
        }
        return false;
    })();

    // MESSAGES
    var messages={
        "START": isPortableMode ? "" : "Press space bar to start.",
        "RESET": isPortableMode ? "" : "Press 'R' to reset.",
        "PAUSE": isPortableMode ? "" : "Press space bar to pause.",
        "RESUME": isPortableMode ? "" : "Press space bar to resume.",
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
        "COMMA": ", ",
        "SPACE": " "
    };

    var setupArena = function() {
        var arena=document.querySelector(".game-arena-display");
        var dimensions=arena.getBoundingClientRect();
        var sampleTile=arena.querySelector("div");
        var tileDimension=getDimension(sampleTile);
        var div=document.createElement("DIV");
        var clone=null;
        var r=1;
        var c=1;
        var rows=Math.floor(dimensions.height / tileDimension.height);
        var columns=Math.floor(dimensions.width / tileDimension.width);
        var rectsCount=columns * rows;
        baseThresholds=[0,columns];

        // clean up
        sampleTile.remove();

        for(var index=0; index < rectsCount; index++) {
            c=index%columns + 1;
            if(index >= columns && c===1) {
                r++;
            }
            clone=div.cloneNode();
            clone.setAttribute("data", [r,c]);
            clone.setAttribute("class", "empty rc_" + r + "_" + c);
            arena.appendChild(clone);
        }

        // set global variables
        row=r;
        column=Math.round(c/2);
        updateGameArenaThresholds(baseThresholds);
        setSpeed();
        levelUpPeriod=calculateLevelUpPeriod();
        updateMessage(messages.START);
        registerKeys();
    };

    var registerKeys = function() {
        if(!isPortableMode) {
            document.querySelectorAll(".life .value span").forEach(function(node) {
                node.innerHTML="&#9829;";
            });

            document.querySelector(".game-actions").classList.add("hide");

            document.addEventListener("keydown", function (event) {
                event.stopPropagation();
                if(!directionChanged) {
                    if(event.keyCode===38 || event.keyCode===87) {
                        handleDirectionChange("north");
                    }
                    else if(event.keyCode===39 || event.keyCode===68) {
                        handleDirectionChange("east");
                    }
                    else if(event.keyCode===40 || event.keyCode===83) {
                        handleDirectionChange("south");
                    }
                    else if(event.keyCode===37 || event.keyCode===65) {
                        handleDirectionChange("west");
                    }
                    event.preventDefault();
                }

                if (event.keyCode===32 && (gameState==="stopped" || gameState===undefined)) {
                    playEventHandler();
                }
                else if (event.keyCode===32 && gameState!=="over") {
                    pauseEventHandler();
                }
                else if (event.keyCode===82 && interval===undefined) { //reset
                    resetEventHandler();
                }
            });
        }
        else {
            document.querySelector(".game-actions").classList.remove("hide");
            updateActionButtonLabel();

            document.addEventListener("touchstart", function(event) {
                var touchobj = event.changedTouches[0];
                dist = 0;
                startX = touchobj.pageX;
                startY = touchobj.pageY;
                startTime = new Date().getTime(); // record time when finger first makes contact with surface
                event.preventDefault();
            }, { passive: false });

//             document.addEventListener("touchmove", function(event) {
//                 event.preventDefault();
//             }, { passive: false });

            document.addEventListener("touchend", function(event) {
                var _swipeDirection;
                var touchobj = event.changedTouches[0];
                distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
                distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
                elapsedTime = new Date().getTime() - startTime; // get time elapsed
                if (elapsedTime <= allowedTime) { // first condition for swipe met
                    if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint){ // 2nd condition for horizontal swipe met
                        _swipeDirection = (distX < 0)? "west" : "east"; // if dist traveled is negative, it indicates left swipe
                    }
                    else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint){ // 2nd condition for vertical swipe met
                        _swipeDirection = (distY < 0)? "north" : "south"; // if dist traveled is negative, it indicates up swipe
                    }
                    handleDirectionChange(_swipeDirection);
                }
                event.preventDefault();
            }, { passive: false });
        }

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
    };

    var handleDirectionChange = function(_swipeDirection) {
        if(!directionChanged) {
            if (_swipeDirection==="north" && direction!=="south" && direction!=="north") { //north 
                addEntity([row, column], (direction==="east" ? "se" : (direction==="west" ? "sw" : "")));
                direction="north";
                directionChanged=true;
            }
            else if (_swipeDirection==="east" && direction!=="west" && direction!=="east") { //east
                addEntity([row, column], (direction==="south" ? "sw" : (direction==="north" ? "nw" : "")));
                direction="east";
                directionChanged=true;
            }
            else if (_swipeDirection==="south" && direction!=="north" && direction!=="south") { //south
                addEntity([row, column], (direction==="east" ? "ne" : (direction==="west" ? "nw" : "")));
                direction="south";
                directionChanged=true;
            }
            else if (_swipeDirection==="west" && direction!=="east" && direction!=="west") { //west
                addEntity([row, column], (direction==="south" ? "se" : (direction==="north" ? "ne" : "")));
                direction="west";
                directionChanged=true;
            }
        }
    };

    var playEventHandler = function() {
        updateRowColumnDirection();
        updateLevel(+localStorage.getItem("selected" + capitalize(selectedMode) + "Level") || 1);
        setSpeed();
        setSpeedInterval();
        setTimer();
        setScorer();
        if (gameState===undefined) {
            updateLife(true);
            generateFood();
        }
        setSnakeLength();
        gameState="play";
        updateMessage(messages.PAUSE);
        hideInstructions();
        isPortableMode && updateActionButtonLabel(messages.PAUSE_BUTTON_LABEL);
    };

    var pauseEventHandler = function() {
        if (gameState!=="paused" && gameState!=="lifeLost") {
            interval=clearInterval(interval);
            timerInterval=clearInterval(timerInterval);
            scoreInterval=clearInterval(scoreInterval);
            flickerInterval=clearInterval(flickerInterval);
            gameState="paused";
            updateMessage(messages.RESUME);
            if(isPortableMode) {
                updateActionButtonLabel(messages.PLAY_BUTTON_LABEL);
                disableResetButton(false);
            }
        }
        else if (gameState==="paused" || gameState==="lifeLost") {
            if (gameState==="lifeLost") {
                !isMazeMode() && clearNodes();
                defaultSettings();
                generateFood();
            }
            setSpeedInterval();
            setTimer();
            setScorer();
            gameState="play";
            updateMessage(messages.PAUSE);
            if(isPortableMode) {
                updateActionButtonLabel(messages.PAUSE_BUTTON_LABEL);
                disableResetButton();
            }
        }
    };

    var resetEventHandler = function() {
        gameState="over";
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
    };

    var defaultSettings = function() {
        updateRowColumnDirection();
        directionChanged=false;
        interval=undefined;
        flickerInterval=clearInterval(flickerInterval);
        meals=[];

        if(gameState==="over") {
            gameState=undefined;
            snakeLife=3;
            setSnakeLength();
            score=0;
            scoreNode.innerText=score;
            time=0.0;
            timerNode.innerText="0s";
            setSpeed();
        }
        else {
            if(!isMazeMode()) {
                setSnakeLength();
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

    // INTERVALS
    var setSpeedInterval = function() {
        interval=clearInterval(interval);
        interval=setInterval(function() {
            moveSnake(direction);
        }, speed);
    };

    var setTimer = function() {
        timerInterval=setInterval(function() {
            timerNode.innerText=(time+=.1).toFixed(1) + "s";
        },100);
    };

    var setScorer = function() {
        scoreInterval=setInterval(function() {
            score += level*snakeLife;
            scoreNode.innerText=score;
        },100);
    };

    // UTILITY METHODS
    var capitalize = function(s) {
        return s[0].toUpperCase() + s.slice(1);   
    };

    var getDimension = function (node) {
        var style=getComputedStyle(node);
        var width=parseInt(style.marginLeft) + parseInt(style.marginRight)
            + parseInt(style.borderLeftWidth) + parseInt(style.borderRightWidth)
            + parseInt(style.paddingLeft) + parseInt(style.paddingRight)
            + parseInt(style.width);
        var height=parseInt(style.marginTop) + parseInt(style.marginBottom)
            + parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth)
            + parseInt(style.paddingTop) + parseInt(style.paddingBottom)
            + parseInt(style.height);

        return { width, height };
    };

    var isClassicMode = function() {
        return selectedMode==="classic";
    };

    var isChallengeMode = function() {
        return selectedMode==="challenge";
    };

    var isMazeMode = function() {
        return selectedMode==="maze";
    };

    var setSnakeLength = function(length) {
        snakeLength=(length || getDefaultSnakeLength());
    };

    var getDefaultSnakeLength = function() {
        return isClassicMode() ? (level===1 ? 3 : levelUpPeriod*(level-1)) : (10+level);
    };

    var updateScore = function(points) {
        score += (points || 10) * level;
    };

    var addLife = function() {
        document.querySelector("span:nth-of-type(" + ++snakeLife + ")").classList.add("available");
    };

    var loseLife = function() {
        document.querySelector("span.available:nth-of-type(" + snakeLife-- + ")").classList.remove("available");
    };

    var updateLife = function(reset) {
        document.querySelectorAll("span").forEach(function(node) {
            node.classList[reset ? "add" : "remove"]("available");
        });
    };

    var updateMessage = function(msg) {
        document.querySelector("div.message").innerHTML=msg || "";
    };

    var updateActionButtonLabel = function(lbl) {
        document.querySelector(".button.play-pause button").innerHTML=lbl||messages.PLAY_BUTTON_LABEL;
    };

    var disableResetButton = function(isDisabled) {
        isDisabled=isDisabled===undefined ? true : false;
        document.querySelector(".button.reset button").disabled=isDisabled;
    };

    var toggleHide = function(btn, hide) {
        document.querySelector(".button." + btn).classList[hide ? "add" : "remove"]("hide");
    };

    var setSpeed = function() {
        speed=calculateSpeed();
    };

    var calculateSpeed = function(lvl) {
        lvl=lvl || level;
        if(isChallengeMode()) {
            return classicModeBaseTime - ((reduction-20)*lvl);
        }
        if(isMazeMode()) {
            return baseTime - ((reduction-16)*lvl);
        }
        return baseTime - (reduction*lvl) + ((lvl >= 9) ? ((reduction/2) * (lvl-8)) : 0);
    };

    var calculateLevelUpPeriod = function() {
        return Math.round(Math.cbrt(southThreshold * eastThreshold));
    };

    var updateLevel = function(lvl) {
        level=lvl;
        levelNode.innerText=lvl;
    };

    var calculateLevels = function() {
        for(var _speed,lvl=1; ; lvl++) {
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
        return lvl;
    };

    var setGameProgressFactor = function() {
        var maxProgressPercentage=100;
        if(isClassicMode()) {
            gameProgressFactor=maxProgressPercentage/(maxLevel*levelUpPeriod);
        }
        else if(isChallengeMode()) {
            var thresholds=predefinedThresholdsForChallengeMode();
            gameProgressFactor=maxProgressPercentage/(Math.pow(thresholds[1]-thresholds[0], 2));
        }
        else if(isMazeMode()) {
            var mazePathLength=document.querySelectorAll(".maze-path").length;
            gameProgressFactor=maxProgressPercentage/mazePathLength;
        }
        console.log("gameProgressFactor", gameProgressFactor);
    };

    var clearNodes = function() {
        nodes.concat(removeNodes).forEach(function (entry) {
            removePath(entry);
        });
        setTimeout(function() {
            nodes=[];
            removeNodes=[];
        }, 0);
    };

    var setRowColumnDirection = function() {
        row=southThreshold;
        column=Math.round(eastThreshold/2);
        direction="north";
    };

    var updateRowColumnDirection = function() {
        if(isMazeMode()) {
            var startingNode;
            var data;

            if(gameState === "lifeLost") {
                startingNode=document.querySelector(".maze-path.head");
            }
            else {
                startingNode=document.querySelector(".maze-path.begin");
            }

            data=startingNode.getAttribute("data").split(",");
            row=+data[0];
            column=+data[1];
            direction=startingNode.getAttribute("direction");

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
        }
        else {
            setRowColumnDirection();
        }
    };

    var hideInstructions = function(flag) {
        flag=(flag===undefined) ? true : flag;
        document.querySelector('.instructions').classList.remove('show', 'hide');
        document.querySelector('.instructions').classList.add(flag ? 'hide' : 'show');
        !flag && updateModeLevels();
    };

    var nodeSelection = function(entry) {
        return entry && document.querySelector(".rc_" + entry[0] + "_" + entry[1]);
    };

    var addEntity = function(entry, entityType) {
        var node=nodeSelection(entry);
        if(node) {
            node.classList.add(entityType);
            node.classList.remove("empty");
        }
    };

    var removeEntityFromNode = function(node, entityType) {
        if(node) {
            node.classList.remove(entityType);
            node.classList.add("empty");
        }
    };

    var removeEntity = function(entry, entityType) {
        var node=nodeSelection(entry);
        removeEntityFromNode(nodeSelection(entry), entityType);
    };

    var removePath = function(entry) {
        if(entry!==undefined) {
            var node=nodeSelection(entry);
            if(node) {
                node.classList.remove("path", "head", "body", "tail", "nw", "ne", "se", "sw", "nw-ne", "ne-se", "se-sw", "sw-nw");
                node.classList.add("empty");
            }
        }
    };

    var addPath = function() {
        for(var node, index=0; index < nodes.length; index++) {
            node=nodeSelection(nodes[index]);
            if(node) {
                node.classList.remove("empty", "head", "body", "nw-ne", "ne-se", "se-sw", "sw-nw");
                node.classList.add("path", index===nodes.length - 1 ? "head" : "body");
                if(index===0) {
                    node.classList.add("tail");
                }
                if(index===nodes.length - 1) {
                    var headClass="";
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

    var onValidPath = function(_coordinate, _selector) {
        var node=nodeSelection(_coordinate);
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

    var onValidMazePath = function(_coordinate) {
        var node=nodeSelection(_coordinate);
        if(node && isMazeMode()) {
            // avoid deviation from maze path
            return node.classList.contains("maze-path");
        }
        return true;
    };

    // LOGIC TO GENERATE FOOD
    var generateFood = function() {
        if(isMazeMode()) {
            return;
        }
        var emptyNodes=document.querySelectorAll(".game-arena-display div.empty:not(.head)");
        if(emptyNodes.length > 0) {
            var emptyNode=emptyNodes[Math.floor(Math.random() * emptyNodes.length)];
            var randomCoordinate=emptyNode.getAttribute("data").split(",");
            var entry=[+randomCoordinate[0], +randomCoordinate[1]];
            meals.push(entry.toString());
            addEntity(entry, "food");
        }
    };

    // LOGIC FOR FLICKER EFFECT
    var induceFlickerEffect = function(flickerCount) {
        flickerCount=flickerCount || 6;
        var paths=document.querySelectorAll(".path");

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
    var inducePause = function(milliseconds) {
       if(gameState!=="paused") {
            interval=clearInterval(interval);
            gameState="paused";
        }
        var pauseInterval=setInterval(function() {
            setSpeedInterval();
            gameState="play";
            pauseInterval=clearInterval(pauseInterval);
        }, milliseconds || 1500);
    };

    // LOGIC TO CHECK IF GAME IS OVER
    var checkGameOver = function(_speed) {
        if(isClassicMode() && _speed < speedCutOff) {
            level--;
            gameOver(10, "Well done! :)", true);
            document.querySelectorAll(".food").forEach(function(node) {
               removeEntityFromNode(node, "food");
            });
            return true;
        }
        if(isChallengeMode()) {
            return document.querySelectorAll(".game-arena-display div.empty:not(.head)").length===0;
        }
        return false;
    };

    // LOGIC TO SAVE GAME STATS
    var saveGameStats = function() {
        time=time.toFixed(1);
        var timestamp=new Date().getTime();
        var stats=localStorage.getItem("snake-game-stats");
        var unlockedLevels=+localStorage.getItem("unlocked" + capitalize(selectedMode) + "Levels");
        var value={
            timestamp, level, score, time, selectedMode
        };

        if(stats!==null) {
            stats=JSON.parse(stats);
            var found=stats.findIndex(function(stat) {
                return stat.score < score;
            });

            if(found!==-1) {
                stats.splice(found, 0, value);
            }
            else {
                stats.push(value);
            }
            localStorage.setItem("snake-game-stats", JSON.stringify(stats));
        }
        else {
            localStorage.setItem("snake-game-stats", JSON.stringify([value]));
        }

        // update unlockedLevels if current level is greater than already stored
        if(level > unlockedLevels) {
            localStorage.setItem("unlocked" + capitalize(selectedMode) + "Levels", level);
        }

        updateLeaderboard();
    };

    // MAZE MODE METHODS
    var randomMazeCoordinatesSelector = function() {
        selectedCoordinates=coordinates[Math.floor(Math.random() * 12)];
        return selectedCoordinates;
    };

    var mazeCoordinatesSelector = function() {
        selectedCoordinates=coordinates[(+localStorage.getItem("selected" + capitalize(selectedMode) + "Level")||1) - 1];
        return selectedCoordinates;
    };

    var clearMazeModeUI = function() {
        // remove all decoration css classes and direction attribute added to the maze-path
        document.querySelectorAll(".maze-mode .maze-path").forEach(function(node) {
            node.removeAttribute("direction");
            node.classList.remove("maze-path", "north", "south", "east", "west", "begin", "end");
        });
        // remove css class maze-mode from game-arena-display
        document.querySelector(".game-arena-display").classList.remove("maze-mode");
    };

    var generateMazePath = function(gridDimension) {
        // proactively clear the maze path first
        clearMazeModeUI();

        document.querySelector(".game-arena-display").classList.add("maze-mode");
        gridDimension=gridDimension || 36;
        mazeCoordinatesSelector();

        var dimension=Math.sqrt(selectedCoordinates.length);
        var factor=gridDimension/dimension;
        var prevCoordinate;
        var cls;
        var prevNode;
        var node;
        var bridgeNode;
        var row;
        var column;
        var prevRow;
        var prevColumn;
        var mazeCls="maze-path";
        var selectedCoordinatesCount=selectedCoordinates.length;
        var extract = function(coordinateValue) {
            return ((coordinateValue + 1) * factor) - 1;
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
                for(var i=1; i < factor; i++) {
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

    // CHALLENGE MODE METHODS
    var predefinedThresholdsForChallengeMode = function() {
        var selectedLevel=+localStorage.getItem("selected" + capitalize(selectedMode) + "Level")||1;
        if(selectedLevel <= 3) {
            return [9,27];
        }
        else if(selectedLevel > 3 && selectedLevel <= 6) {
            return [6,30];
        }
        else if(selectedLevel > 6 && selectedLevel <= 9) {
            return [3,33];
        }
        return [0,36];
    };

    var updateGameArenaThresholds = function(thresholds) {
        // update the threshold limits
        northThreshold=thresholds[0]+1;
        westThreshold=thresholds[0]+1;
        eastThreshold=thresholds[1];
        southThreshold=thresholds[1];
        // update the starting coordinates and direction
        setRowColumnDirection();
    };

    var updateChallengeModeUI = function(thresholds) {
        thresholds = thresholds || predefinedThresholdsForChallengeMode();
        // proactively clear the classic mode first
        clearChallengeModeUI();

        // update game arena limits
        updateGameArenaThresholds(thresholds);

        document.querySelectorAll(".empty").forEach(function(node) {
            var coordinate = node.getAttribute("data").split(",");
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

    var clearChallengeModeUI = function() {
        updateGameArenaThresholds(baseThresholds);
        document.querySelectorAll(".danger").forEach(function(node) {
            node.classList.remove("danger");
            node.classList.add("empty");
        });
    };

    // EVENT HANDLERS
    var modeSelectionEventHandler = function(event) {
        event.stopPropagation();
        document.querySelector('.modes div.selected').classList.remove('selected');
        this.classList.add('selected');
        selectedMode=this.getAttribute("data");
        localStorage.setItem("selectedMode", selectedMode);
        // calculate the max levels possible for selected mode
        maxLevel=calculateLevels();
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
    };

    var levelSelectionEventHandler = function(event) {
        event.stopPropagation();
        document.querySelector('.levels div.selected').classList.remove('selected');
        this.classList.add('selected');
        localStorage.setItem("selected" + capitalize(selectedMode) + "Level", +this.getAttribute("data"));
        if(isMazeMode()) {
            generateMazePath();
        }
        if(isChallengeMode()) {
            updateChallengeModeUI();
        }
        setSnakeLength();
    };

    // SELECTION UI METHODS
    var addAvailableModes = function() {
        var levelsContainer=document.querySelector(".selectMode .modes");
        var div=document.createElement("DIV");
        var clone;

        availableModes.forEach(function(mode) {
            clone=div.cloneNode();
            clone.setAttribute("data", mode);
            clone.setAttribute("class", "mode");
            clone.innerText=mode;
            levelsContainer.appendChild(clone);
        });
    };

    var updateModes = function() {
        var unlockedModes=JSON.parse(localStorage.getItem("unlockedModes"))||[selectedMode];

        selectedMode=localStorage.getItem("selectedMode")||selectedMode;
        document.querySelectorAll(".selectMode .modes .mode").forEach(function(node, index) {
            var modeValue=node.getAttribute("data");
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

    var clearModeLevels = function() {
        document.querySelectorAll(".selectLevel .levels .level").forEach(function(node) {
            node.remove();
        });
    };

    var addModeLevels = function() {
        var levelsContainer=document.querySelector(".selectLevel .levels");
        var div=document.createElement("DIV");
        var clone;

        for(var lvl=1; lvl<=maxLevel; lvl++) {
            clone=div.cloneNode();
            clone.setAttribute("data", lvl);
            clone.setAttribute("class", "level");
            clone.innerText=lvl;
            levelsContainer.appendChild(clone);
        }
    };

    var updateModeLevels = function() {
        var selectedLevel=+localStorage.getItem("selected" + capitalize(selectedMode) + "Level")||1;
        var unlockedLevels=+localStorage.getItem("unlocked" + capitalize(selectedMode) + "Levels")||1;

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

    var displayModeInstructions = function() {
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
    var updateLeaderboard = function(limit) {
        limit=limit || 3;
        var leaderboard=document.querySelector(".leaderboard");
        var stats=JSON.parse(localStorage.getItem("snake-game-stats"));

        // if stats is not null, then filter stats based on the selected game mode
        if(stats!==null) {
            stats=stats.filter(function(stat) {
                return stat.selectedMode===selectedMode;
            });
        }

        // check if we have entries for the selected game mode after filtering
        if(stats && stats.length > 0) {
            var keys= Object.keys(stats[0]);
            var row="<div class='row'>";
            row += "<div class='padded'></div>";
            row += "<div class='column head'>S.No</div>";
            keys.forEach(function(key, idx) {
                if(key!=="timestamp") {
                    row += "<div class='column head'>" + key + "</div>";
                }
            });
            row += "<div class='padded'></div>";
            row += "</div>";

            for(var stat, index=0; index < limit; index++) {
                stat=stats[index];
                if(stat) {
                    row += "<div class='row'>";
                    row += "<div class='padded'></div>";
                    row += "<div class='column'>" + (index+1) + ".</div>";
                    keys.forEach(function(key, idx) {
                        if(key!=="timestamp") {
                            row += "<div class='column'>" + stat[key] + "</div>";
                        }
                    });
                    row += "<div class='padded'></div>";
                    row += "</div>";
                }
            }
            leaderboard.innerHTML=row;
        }
        else {
            leaderboard.innerHTML="<div class='message'>" + messages.TOP_3_SCORES + "</div>";
        }
    };

    // LOGIC FOR GAME OVER
    var gameOver = function(count, msg, bypassSnakeLife) {
        bypassSnakeLife=(bypassSnakeLife===undefined) ? false : bypassSnakeLife;
        interval=clearInterval(interval);
        timerInterval=clearInterval(timerInterval);
        scoreInterval=clearInterval(scoreInterval);
        induceFlickerEffect(count);

        //if(isMazeMode() && document.querySelector(".maze-mode .head").classList.contains("end")) {
        if(isMazeMode() && parseInt(gameProgressBar.style.width)===100) {
            var selectedLevel=+localStorage.getItem("selected" + capitalize(selectedMode) + "Level")||1;
            var unlockedLevels=+localStorage.getItem("unlocked" + capitalize(selectedMode) + "Levels")||1;

            bypassSnakeLife=true;

            if(selectedLevel===unlockedLevels && selectedLevel<maxLevel) {
                msg=messages.CONGRATULATIONS + messages.COMMA + messages.LEVEL_UNLOCKED + messages.SPACE + messages.RESET;
                level++;
            }
            else if(selectedLevel < unlockedLevels) {
                msg=messages.CONGRATULATIONS + messages.SPACE + messages.RESET;
            }
            else {
                msg=messages.AMAZING + messages.COMMA + messages.ALL_LEVELS_COMPLETED + messages.SPACE + messages.RESET;
            }
            // update games stats once the maze is completed successfully
            saveGameStats();
        }

        if(!bypassSnakeLife && snakeLife > 1) {
            loseLife();
            gameState="lifeLost";
            updateMessage(snakeLife + messages.SPACE + (snakeLife===1 ? messages.LIFE_REMAINING : messages.LIVES_REMAINING) + messages.SPACE + messages.RESUME);
            updateActionButtonLabel(messages.PLAY_BUTTON_LABEL);
        }
        else {
            gameState="over";
            updateLife();
            updateMessage(msg || messages.GAME_OVER + messages.SPACE + messages.RESET);
            toggleHide("play-pause", true);
            // specific check for maze mode as we want to update the game stats only when maze is completed successfully
            !isMazeMode() && saveGameStats();
        }
        disableResetButton(false);
    };

    // SNAKE MOVE LOGIC
    var moveSnake = function() {
        directionChanged=false;
        if(direction==="north") {
            if(nodes.length < snakeLength) {
                if(row > northThreshold && onValidMazePath([row-1, column])) {
                    if(nodes.length > 0) {
                        nodes.push([--row,column]);
                    }
                    else {
                        row=row - (row===southThreshold ? 0 : 1);
                        nodes.push([row,column]);
                    }
                }
                else {
                    gameOver(7);
                }
                // useful for maze-mode
                if(onValidPath([row, column], (isMazeMode() ? "maze-path" : "body"))) {
                    removePath(removeNodes.shift());
                    addPath();
                }
                else {
                    gameOver(7);
                }
            }
            else {
                removeNodes.push(nodes.shift());
                if(row > northThreshold && onValidPath([row-1, column], (isMazeMode() ? "maze-path" : "body"))) {
                    nodes.push([--row,column]);
                    // useful for maze-mode
                    if(onValidPath([row, column], (isMazeMode() ? "maze-path" : "body"))) {
                        removePath(removeNodes.shift());
                        addPath();
                    }
                    else {
                        gameOver(7);
                    }
                }
                else {
                    gameOver(7);
                }
            }
        }
        else if(direction==="south") {
            if(nodes.length < snakeLength) {
                if(row < southThreshold && onValidMazePath([row+1, column])) {
                    if(nodes.length > 0) {
                        nodes.push([++row,column]);
                    }
                    else {
                        row=row+(row===southThreshold ? 0 : 1);
                        nodes.push([row,column]);
                    }
                }
                else {
                    gameOver(7);
                }
                // useful for maze-mode
                if(onValidPath([row, column], (isMazeMode() ? "maze-path" : "body"))) {
                    removePath(removeNodes.shift());
                    addPath();
                }
                else {
                    gameOver(7);
                }
            }
            else {
                removeNodes.push(nodes.shift());
                if(row < southThreshold && onValidPath([row+1, column], (isMazeMode() ? "maze-path" : "body"))) {
                    nodes.push([++row,column]);
                    // useful for maze-mode
                    if(onValidPath([row, column], (isMazeMode() ? "maze-path" : "body"))) {
                        removePath(removeNodes.shift());
                        addPath();
                    }
                    else {
                        gameOver(7);
                    }
                }
                else {
                    gameOver(7);
                }
            }
        }
        else if(direction==="east") {
            if(nodes.length < snakeLength) {
                if(column < eastThreshold && onValidMazePath([row, column+1])) {
                    if(nodes.length > 0) {
                        nodes.push([row,++column]);
                    }
                    else {
                        column=column+(column > 1 ? 1 : 0);
                        nodes.push([row,column]);
                    }
                }
                else {
                    gameOver(7);
                }
                // useful for maze-mode
                if(onValidPath([row, column], (isMazeMode() ? "maze-path" : "body"))) {
                    removePath(removeNodes.shift());
                    addPath();
                }
                else {
                    gameOver(7);
                }
            }
            else {
                removeNodes.push(nodes.shift());
                if(column < eastThreshold && onValidPath([row, column+1], (isMazeMode() ? "maze-path" : "body"))) {
                    nodes.push([row,++column]);
                    // useful for maze-mode
                    if(onValidPath([row, column], (isMazeMode() ? "maze-path" : "body"))) {
                        removePath(removeNodes.shift());
                        addPath();
                    }
                    else {
                        gameOver(7);
                    }
                }
                else {
                    gameOver(7);
                }
            }
        }
        else if(direction==="west") {
            if(nodes.length < snakeLength) {
                if(column > westThreshold && onValidMazePath([row, column-1])) {
                    if(nodes.length > 0) {
                        nodes.push([row,--column]);
                    }
                    else {
                        column=column-(column > 1 ? 1 : 0);
                        nodes.push([row,column]);
                    }
                }
                else {
                    gameOver(7);
                }
                // useful for maze-mode
                if(onValidPath([row, column], (isMazeMode() ? "maze-path" : "body"))) {
                    removePath(removeNodes.shift());
                    addPath();
                }
                else {
                    gameOver(7);
                }
            }
            else {
                removeNodes.push(nodes.shift());
                if(column > westThreshold && onValidPath([row, column-1], (isMazeMode() ? "maze-path" : "body"))) {
                    nodes.push([row,--column]);
                    // useful for maze-mode
                    if(onValidPath([row, column], (isMazeMode() ? "maze-path" : "body"))) {
                        removePath(removeNodes.shift());
                        addPath();
                    }
                    else {
                        gameOver(7);
                    }
                }
                else {
                    gameOver(7);
                }
            }
        }
        updateGameStatus();
        updateGameProgress();
        // increment the count of maze path traversed
        isMazeMode() && mazePathTraversed++;    
    };

    // LOGIC TO UPDATE THE STATE OF GAME
    var updateGameStatus = function() {
        var mealIndex, dangerIndex;
        var currentLocation=[row, column];

        mealIndex=meals.indexOf(currentLocation.toString());
        if(mealIndex!==-1) {
            meals.splice(mealIndex,1);
            removeEntity(currentLocation, "food");
            updateScore();
            generateFood();
            snakeLength++;

            if(isClassicMode() && snakeLength % levelUpPeriod===0) {
                levelNode.innerText=++level;
                setSpeed();
                if(!checkGameOver(speed)) {
                    inducePause(100);
                }
                else {
                    levelNode.innerText=level;
                }
            }
            else if(isChallengeMode()) {
                checkGameOver();
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
            return;
        }
    };

    // LOGIC FOR UPDATING GAME PROGRESS BAR
    var updateGameProgress = function() {
        gameProgressBar.style.borderColor="green";
        if(isClassicMode() && snakeLength > 3) {
            gameProgressBar.style.width=(gameProgressFactor*snakeLength) + "%";
            return;
        }
        if(isChallengeMode()) {
            gameProgressBar.style.width=(gameProgressFactor*snakeLength) + "%";
            return;
        }
        if(isMazeMode()) {
            // maintain a mazePathTraversed count
            gameProgressBar.style.width=(gameProgressFactor*mazePathTraversed) + "%";
            return;
        }
    };

    // LOGIC TO RESET GAME PROGRESS BAR
    var resetGameProgress = function() {
        gameProgressBar.style.width=0;
        gameProgressBar.style.borderColor="transparent";
        if(isMazeMode()) {
            mazePathTraversed=0;
        }
    };

    // CLEAN-UP GLOBALS
    coordinates=window.coordinates["12x12"];
    window.coordinates=null;

    // SET UP THE GAME
    localStorage.setItem("unlockedModes", JSON.stringify(unlockedModes));

    // selectedMode is important to be decided first as other calculations are dependent on it
    selectedMode=localStorage.getItem("selectedMode")||selectedMode;
    updateLevel(+localStorage.getItem("selected" + capitalize(selectedMode) + "Level") || 1);
    maxLevel=calculateLevels();
    setSnakeLength();

    setupArena();
    addAvailableModes();
    updateModes();
    addModeLevels();
    updateModeLevels();
    displayModeInstructions();
    updateLeaderboard();
    
    setGameProgressFactor();
})();