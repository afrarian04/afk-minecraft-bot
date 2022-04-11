const mineflayer = require('mineflayer')
const cmd = require('mineflayer-cmd').plugin
const fs = require('fs');
let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);
var lasttime = -1;
var isKicked = false;
var moving = 0;
var first = false;
var connected = 0;
var actions = ['forward', 'back', 'left', 'right']
var lastaction;
var pi = 3.14159;
var moveinterval = 2; // 2 second movement interval
var maxrandom = 5; // 0-5 seconds added to movement interval (randomly)
var host = data["ip"];
var username = data["name"]
var nightskip = data["auto-night-skip"]

const botArgs = {
    host: host,
    port: data["port"],
    username: username
}

const initBot = () => {
    var bot = mineflayer.createBot(botArgs);

    bot.loadPlugin(cmd)

    bot.on('login', function () {
        console.log("Mencoba Login")
        if (data["login-enabled"] == "true") {
            bot.chat(data["register-cmd"])
            bot.chat(data["login-cmd"])
        }
        for (let i = 0; i < 10; i++) {
            task(i);
        }
        console.log("Sukses Login")
        bot.chat("Halo semua");
        if (isKicked) {
            bot.chat("Kenapa aku di kick? :(")
        }

    });

    function task(i) {

        setTimeout(function () {
            if (first == true) {
                first = false;
            }
            else {
                first = true;
            }
        }, 3600000 * i);
    }


    bot.on('time', function (time) {
        if (nightskip == "true") {
            if (bot.time.timeOfDay >= 13000) {
                bot.chat('/time set day')
            }
        }
        if (connected < 1) {
            return;
        }
        if (lasttime < 0) {
            lasttime = bot.time.age;
        } else {
            var randomadd = Math.random() * maxrandom * 20;
            var interval = moveinterval * 20 + randomadd;
            if (bot.time.age - lasttime > interval) {
                if (moving == 1) {
                    bot.setControlState(lastaction, false);
                    moving = 0;
                    lasttime = bot.time.age;
                } else {
                    // var yaw = Math.random()*pi - (0.5*pi);
                    // var pitch = Math.random()*pi - (0.5*pi);
                    // bot.look(yaw,pitch,false);
                    lastaction = actions[Math.floor(Math.random() * actions.length)];
                    bot.setControlState(lastaction, true);
                    moving = 1;
                    lasttime = bot.time.age;
                    bot.activateItem();
                }
            }

            const items = bot.inventory.items()
            const dropper = (i) => {
                if (!items[i]) return // if we dropped all items, stop.
                bot.tossStack(items[i], () => dropper(i + 1)) // drop the item, then wait for a response from the server and drop another one.
            }
            dropper(0)


        }
    });

    bot.on("end", function (reason) {
        setTimeout(initBot, 10*1000);
        connected = 1;
        isKicked = false;
    });

    bot.on("kicked", function(reason, loggedIn) {
        isKicked = true;
    });

    bot.on('entityHurt', function (entity) {
        bot.chat(`ADUH!`);
    });

    function lookAtNearestPlayer() {
        const playerFilter = (entity) => entity.type === 'player'
        const playerEntity = bot.nearestEntity(playerFilter)

        if (!playerEntity) return

        const pos = playerEntity.position.offset(0, playerEntity.height, 0)
        bot.lookAt(pos)
    }

    bot.on('physicTick', lookAtNearestPlayer)

    bot.on('spawn', function () {
        connected = 1;
    });

    bot.on('death', function () {
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;

        if (message === `hai ${bot.username}` || message === `halo ${bot.username}`) {
            bot.chat(`Halo ${username}`);
        }
    });
}

initBot();