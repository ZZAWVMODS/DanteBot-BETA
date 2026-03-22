const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  makeCacheableSignalKeyStore,
  isJidStatusBroadcast,
  isJidNewsletter,
  jidDecode,
  Browsers 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");
const fs = require("fs");
const os = require("os");
const readline = require("readline");
const handler = require("./handler");
const groupHandler = require("./groupHandler"); 
const NodeCache = require("node-cache"); 

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const msgRetryCounterCache = new NodeCache();

global.activeSubBots = new Map();
global.reconnectAttempts = new Map();

global.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return (decode.user && decode.server && `${decode.user}@${decode.server}`) || jid;
    }
    return jid;
};

function isSocketHealthy(socket) {
    try {
        return socket && 
               socket.user && 
               socket.ws && 
               socket.ws.readyState === 1 &&
               !socket.ws._closed;
    } catch (err) {
        return false;
    }
}

function cleanTempFiles() {
    try {
        const tempDirs = [
            path.resolve(__dirname, "session"),
            path.resolve(__dirname, "sub_bots"),
            path.resolve(__dirname, "tmp"),
            path.resolve(__dirname, "temp"),
            os.tmpdir()
        ];
        
        let filesDeleted = 0;
        
        tempDirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    try {
                        const stats = fs.statSync(filePath);
                        if (fs.lstatSync(filePath).isFile()) {
                            if (file.endsWith('.tmp') || file.endsWith('.temp') || file.includes('temp-') || file.includes('tmp-')) {
                                fs.unlinkSync(filePath);
                                filesDeleted++;
                            }
                        }
                    } catch (e) {}
                });
            }
        });
        
        if (filesDeleted > 0) {
            console.log(`🧹 Limpieza completada: ${filesDeleted} archivos eliminados.`);
        }
    } catch (err) {
        console.error("Error en limpieza de temporales:", err);
    }
}

// --- FIX MENCIONES PARA COMANDO BOTS ---
global.getBotList = () => {
    let menciones = [];
    let texto = `• • •[ *𝐃𝐚𝐧𝐭𝐞 𝐁𝐨𝐭 𝐒𝐨𝐜𝐤𝐞𝐭's* ]• • •\n\n`;
    texto += `*sᴜʙ - ʙᴏᴛs ᴀᴄᴛɪᴠᴏs* [ ${global.activeSubBots.size} ]\n\n`;

    global.activeSubBots.forEach((val, key) => {
        texto += `• @${key}\n`;
        menciones.push(`${key}@s.whatsapp.net`);
    });

    texto += `\n> *𝕯𝖆𝖓𝖙𝖊 𝕭𝖔𝖙*`;
    return { texto, menciones };
};

global.startSubBot = async (parentSocket, m, phoneNumber) => {
  const numLimpio = phoneNumber.replace(/[^0-9]/g, '');
  
  if (numLimpio.length < 10) {
    if (m && parentSocket) {
      return parentSocket.sendMessage(m.key.remoteJid, { 
        text: `*Error:*\n\n_El número es demasiado corto para ser válido._\n\n\`Asegúrate de incluir el código de país (Ej: 50496228919)\`` 
      }, { quoted: m });
    }
    return;
  }

  const existing = global.activeSubBots.get(numLimpio);
  if (existing && existing.socket && isSocketHealthy(existing.socket)) {
    if (m && parentSocket) {
      return parentSocket.sendMessage(m.key.remoteJid, { 
        text: `*Advertencia*\n\nEl número *${numLimpio}* ya está activo en el sistema.` 
      }, { quoted: m });
    }
    return;
  }

  // --- FIX: CREACIÓN DE CARPETA RECURSIVA PARA EVITAR ENOENT ---
  const subBotFolder = path.resolve(__dirname, "sub_bots", numLimpio);
  if (!fs.existsSync(subBotFolder)) {
      fs.mkdirSync(subBotFolder, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(subBotFolder);
  const { version } = await fetchLatestBaileysVersion();

  const subSocket = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
    },
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
    browser: Browsers.ubuntu("Chrome"), 
    markOnlineOnConnect: true,
    syncFullHistory: false,
    retryRequestDelayMs: 5000,
    maxMsgRetryCount: 5,
    keepAliveIntervalMs: 30000,
    defaultQueryTimeoutMs: 60000,
    shouldIgnoreJid: (jid) => isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid)
  });

  global.activeSubBots.set(numLimpio, { 
    socket: subSocket, 
    lastSeen: Date.now()
  });

  if (!subSocket.authState.creds.registered && m && parentSocket) {
    setTimeout(async () => {
      try {
        const code = await subSocket.requestPairingCode(numLimpio);
        await parentSocket.sendMessage(m.key.remoteJid, { 
          text: `*𝐂𝐫𝐞𝐚𝐫 𝐒𝐨𝐜𝐤𝐞𝐭 𝐃𝐚𝐧𝐭𝐞 𝐁𝐨𝐭*\n\n> *Instrucciones:*\n1. Ve a Dispositivos vinculados.\n2. Vincular con número de teléfono.\n3. Ingresa el código que aparece abajo.` 
        }, { quoted: m });
        await parentSocket.sendMessage(m.key.remoteJid, { text: code });
      } catch (e) {
        console.error(`Error pairing ${numLimpio}:`, e);
      }
    }, 3000);
  }

  subSocket.ev.on("creds.update", saveCreds);

  subSocket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === "open") {
      console.log(`✅ Sub-Bot Conectado: ${numLimpio}`);
      
      if (m && parentSocket) {
        await parentSocket.sendMessage(m.key.remoteJid, { 
          text: `✅ *Dante Bot:* El Sub-Bot del número +${numLimpio} se ha activado correctamente.` 
        }, { quoted: m });
      }
      
      global.reconnectAttempts.set(numLimpio, 0);
    }
    
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      
      if (statusCode === DisconnectReason.loggedOut) {
        if (fs.existsSync(subBotFolder)) fs.rmSync(subBotFolder, { recursive: true, force: true });
        global.activeSubBots.delete(numLimpio);
      } else {
        // Reconexión simple
        setTimeout(() => global.startSubBot(parentSocket, null, numLimpio), 5000);
      }
    }
  });

  subSocket.ev.on("messages.upsert", async (chatUpdate) => {
    const msg = chatUpdate.messages[0];
    if (msg.message) {
        await handler(subSocket, msg);
    }
  });

  subSocket.ev.on("group-participants.update", async (anu) => {
    await groupHandler(subSocket, anu);
  });
};

const resumeSubBots = async (parentSocket) => {
  const subBotsPath = path.resolve(__dirname, "sub_bots");
  if (fs.existsSync(subBotsPath)) {
    const dirs = fs.readdirSync(subBotsPath).filter(file => {
      try {
        return fs.lstatSync(path.join(subBotsPath, file)).isDirectory();
      } catch {
        return false;
      }
    });
    
    for (let i = 0; i < dirs.length; i++) {
      setTimeout(() => {
        global.startSubBot(parentSocket, null, dirs[i]);
      }, i * 3000);
    }
  }
};

async function connect() {
  console.log("\n" + "=".repeat(50));
  console.log("🔄 INICIANDO DANTE BOT PRINCIPAL");
  console.log("=".repeat(50) + "\n");
  
  cleanTempFiles();
  
  const sessionPath = path.resolve(__dirname, "session");

  // --- FIX: CREACIÓN DE CARPETA RECURSIVA PARA SESIÓN PRINCIPAL ---
  if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
  }
  
  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      auth: { 
        creds: state.creds, 
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) 
      },
      msgRetryCounterCache, 
      browser: Browsers.ubuntu("Chrome"),
      markOnlineOnConnect: true,
      shouldIgnoreJid: (jid) => isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid),
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      retryRequestDelayMs: 5000,
      maxMsgRetryCount: 5,
      keepAliveIntervalMs: 30000,
      defaultQueryTimeoutMs: 60000,
    });

    if (!socket.authState.creds.registered) {
      console.log("\n⚠️ Credenciales no configuradas");
      const phoneNumber = await question("📱 Ingrese el número de teléfono para el bot:\n> ");
      
      if (phoneNumber) {
        setTimeout(async () => {
          try {
            const code = await socket.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
            console.log(`\nCódigo de vinculación: ${code}\n`);
          } catch (err) {
            console.error("Error generando código:", err.message);
          }
        }, 3000);
      }
    }

    socket.ev.on("connection.update", async (u) => {
      if (u.connection === "open") { 
        console.log("\nBot Principal DanteBot Conectado ✅"); 
        await resumeSubBots(socket);
      }
      
      if (u.connection === "close") {
        const statusCode = u.lastDisconnect?.error?.output?.statusCode;
        if (statusCode !== DisconnectReason.loggedOut) {
            console.log("🔄 Reconectando bot principal...");
            setTimeout(connect, 5000);
        } else {
            console.log("🔒 Sesión principal cerrada permanentemente");
            process.exit(0);
        }
      }
    });

    socket.ev.on("creds.update", saveCreds);
    socket.ev.on("messages.upsert", async (c) => { 
      if (c.messages[0].message) await handler(socket, c.messages[0]); 
    });
    socket.ev.on("group-participants.update", async (anu) => {
      await groupHandler(socket, anu);
    });

  } catch (err) {
    console.error("Error fatal:", err);
    setTimeout(connect, 10000);
  }
}

async function startMenu() {
  console.log(`\n╔════════════════════════════════════╗\n║         𝐃𝐀𝐍𝐓𝐄 𝐁𝐎𝐓 - 𝐒𝐘𝐒𝐓𝐄𝐌          ║\n╠════════════════════════════════════╣\n║ 1. Conectar Bot Principal          ║\n║ 2. Iniciar solo Sub-Bots           ║\n╚════════════════════════════════════╝`);
  const option = await question("Seleccione una opción: ");
  if (option === "1") connect(); 
  else if (option === "2") resumeSubBots(null); 
  else process.exit();
}

startMenu();
