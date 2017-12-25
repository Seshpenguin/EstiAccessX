# EstiAccess X
Create scaleable, maintainble, remotely managed Minecraft server instances.

EstiAccess X is a remote management UI and daemon manager built for Minecraft Servers running on Linux. Servers can be run as daemons on systemd, and directly interacted with using a client GUI. Features include automatic crash handling, startup/shutdown, remote command execution, and FS interaction.

---
## Implemented features
### EAX Server
- [x] Automatic start/restart
- [x] Direct console interaction
- [x] FS Interaction (update plugins, etc)
    - Implemented using a subset of the FTP Protocol.
- [ ] Systemd/Init System intergration.

### EAX  Client
- [x] Console View
- [x] Remote command execution
- [ ] FS interaction
- [ ] Multi-server view

---
## Usage
To start the EAX Server:
```bash
cd EAXServer
node index.js
```
EAX will load the Minecraft Server (as defined in **spawn.sh**) using a jar given to it (default: PaperSpigot-latest.jar). EAX will set the server's working directory to the "**server**" directory.

EAX Server will listen on port 3000 for the console management, and port 3001 for the file server.

To start the EAX Client:
```bash
cd EAXClient
electron .
```
---

**Enjoy!** Remember that EstiAccess X is still in development and things will get better over time.
