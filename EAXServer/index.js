/*
 * EstiAccess X
 * Wraps a Minecraft Server process with restart handling, remote access, etc.
 * For Linux only.
 */

var colors = require('colors');
var io = require('socket.io')();
var fs = require('fs');
const ftpd = require('simple-ftpd')

const readline = require('readline');
const { spawn } = require('child_process');
var stdin = process.openStdin();
let server; //declare server instance
let shouldStop = false;
let logFile = "EAXLog.txt"

let version = "v1.0 (Parfait) - Beta 1"

// clear EAX log file
fs.truncate(logFile, 0, function () { console.log('[EstiX] Cleared log file'.blue) })

/* SocketIO Server! */
io.on('connection', function (socket) {
    console.log('Socket connection established');
    socket.on('EAX-getFullLog', (data, fn) => {
        console.log('[EstiX] Sending client full log'.blue);

        const rl = readline.createInterface({
            input: fs.createReadStream(logFile)
        });

        rl.on('line', function (line) {
            //console.log('Line from file:', line);
            fn('[EstiX] Loading server log...');
            socket.emit('EAX-serverMessage', line);
        });
    });
    socket.on('EAX-sendCommand', (data) => {
        server.stdin.write(data);
        //console.log(data);
    });
});
io.listen(3000);

console.log('[EstiX] Listening on port 3000'.blue.bold);

/* FTP Server! */
ftpd({ host: '127.0.0.1', port: 3001, root: '/home/seshpenguin/Documents/EstiAccessX/EAXServer/' }, (session) => {

  session.on('pass', (username, password, cb) => {
    if (username === 'EAXUser' && password === 'EAXPass') {
      session.readOnly = false
      session.root = '/home/seshpenguin/Documents/EstiAccessX/EAXServer/'
      cb(null, '<--- Connected to EAXServer File Server --->')
    } else {
      cb(null, '<--- EAXServer AUTHENTICATION FAILED --->')
      session.root = '/home/seshpenguin/Documents/EstiAccessX/EAXServer/stub/'
    }
  })

  session.on('stat', fs.stat)
  // AKA
  // session.on('stat', (pathName, cb) => {
  //  fs.stat(pathName, cb)
  // })

  session.on('readdir', fs.readdir)
  // AKA
  // session.on('readdir', (pathName, cb) => {
  //   fs.readdir(pathName, cb)
  // })

  session.on('read', (pathName, offset, cb) => {
    cb(null, fs.createReadStream(pathName, { start: offset }))
  })

  session.on('write', (pathName, offset, cb) => {
    cb(null, fs.createWriteStream(pathName, { start: offset }))
  })

  // I'd do some checking if I were you, but hey.

  session.on('mkdir', fs.mkdir)
  session.on('unlink', fs.unlink)
  session.on('rename', fs.rename)
  session.on('remove', require('rimraf'))
})
console.log('[EstiX] File Server listening on port 3001'.blue.bold);


/* Minecraft Server! */
//server = spawn('./spawn.sh', ['-jar', './server/PaperSpigot-latest.jar']);
startServer();

process.on('SIGINT', function () {
    console.log();
    console.log("[EstiX] Caught SIGINT".bold.blue);
    shouldStop = true;
    console.log("[EstiX] Stopping server...".bold.blue);
    //server.stdin.write("stop\n");

});

//input handling.
stdin.addListener("data", function (d) {
    if (d.toString().trim() == "stop") {
        console.log("[EstiX] Stopping server...".bold.blue);
        shouldStop = true;
    }else if(d.toString().trim() == "eax version"){
        console.log("[EstiX] EstiAccess X Version: ".bold.blue + version);
    }
    server.stdin.write(d.toString().trim() + "\n");

    setTimeout(drawCursor, 1000);
});

function drawCursor() {
    process.stdout.write(`> `.bold.cyan);
}

// Minecraft Server function
function startServer() {

    server = spawn('./spawn.sh', ['-jar', './server/PaperSpigot-latest.jar']);

    shouldStop = false;

    server.on('close', (code) => {
        console.log(`[EstiX] Server exited with code ${code}`.bold.red);
        //delete (server); //clean up
        if (shouldStop == false) {
            console.log(`[EstiX] Restarting server...`.bold.red);
            setTimeout(startServer, 5000);
        } else {
            console.log(`[EstiX] Exiting...`.bold.red);
            process.exit();
        }

    });

    server.stdout.on('data', (data) => {
        //colours!
        if (`${data}`.indexOf('Done') > -1) {
            setTimeout(drawCursor, 1000);
            process.stdout.write(`${data}`.blue.bold);
        }
        else if (`${data}`.indexOf('Stopping the server') > -1) {
            process.stdout.write(`${data}`.red.bold);
        }
        else if (`${data}`.indexOf('[EstiX]') > -1) {
            process.stdout.write(`${data}`.blue);
        }
        else if (`${data}`.indexOf('WARN') > -1) {
            process.stdout.write(`${data}`.yellow);
        }
        else if (`${data}`.indexOf('INFO') > -1) {
            process.stdout.write(`${data}`.green);
        }
        else {
            process.stdout.write(`${data}`);
        }

        //send to EAX client
        var parsedData = `${data}`;
        parsedData = parsedData.slice(0, parsedData.length - 1)
        io.sockets.emit('EAX-serverMessage', parsedData);

        // log to file
        fs.appendFile(logFile, `${data}`, function (err) { if (err) throw err; });

    });

    server.stderr.on('data', (data) => {
        console.log(`ERROR: ${data}`);
    });

}


