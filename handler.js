const config = require("./config");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { jidDecode } = require("@whiskeysockets/baileys");

const dbPath = './database.json';
const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

let database = { antilink: [], welcome: [], muted: {}, adminOnly: [] };
if (fs.existsSync(dbPath)) {
    try { database = JSON.parse(fs.readFileSync(dbPath)); } catch (e) { console.error("Error DB:", e); }
}

function normalizeJid(jid) {
  if (!jid) return jid;
  if (/:\\d+@/gi.test(jid)) {
    const decode = jidDecode(jid);
    if (!decode) return jid; 
    return (decode.user && decode.server && `${decode.user}@${decode.server}`) || jid;
  }
  return jid;
}

// Inicialización de objeto global para rastrear búsquedas activas
global.stklySearch = global.stklySearch || {};

// DEFINIR LA FUNCIÓN HANDLER
const handler = async (socket, m) => {
    try {
        if (!m || !m.message) return;
        if (!socket) return; 

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const botNumber = normalizeJid(socket.user.id);
        
        const rawSender = isGroup ? (m.key.participant || m.key.remoteJid) : (m.key.fromMe ? socket.user.id : from);
        const sender = normalizeJid(rawSender);

        const body = m.message?.conversation || 
                     m.message?.extendedTextMessage?.text || 
                     m.message?.imageMessage?.caption || 
                     m.message?.buttonsResponseMessage?.selectedButtonId || 
                     m.message?.listResponseMessage?.singleSelectReply?.selectedRowId || 
                     m.message?.templateButtonReplyMessage?.selectedId || 
                     "";

        if (!body) return;

        // Obtener metadata del grupo si es necesario
        let groupAdmins = [];
        let isAdmins = false;
        let isBotAdmin = false;
        
        if (isGroup) {
            if (!socket.groupCache) socket.groupCache = {};
            let groupMetadata;
            try {
                if (socket.groupCache[from] && (Date.now() - socket.groupCache[from].lastUpdate < 300000)) {
                    groupMetadata = socket.groupCache[from].metadata;
                } else {
                    groupMetadata = await socket.groupMetadata(from);
                    socket.groupCache[from] = { metadata: groupMetadata, lastUpdate: Date.now() };
                }
                groupAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
                isAdmins = groupAdmins.includes(sender);
                isBotAdmin = groupAdmins.includes(botNumber);
            } catch (e) { console.error("Error metadata:", e.message); }
        }

        const senderNumber = sender.split('@')[0];
        const isOwner = m.key.fromMe || 
                        senderNumber === config.ownerNumber || 
                        sender === config.ownerJid ||
                        sender === config.ownerLid;

        // --- INTERCEPTOR DE NÚMEROS PARA STICKERLY ---
        const isNumeric = /^\d+$/.test(body.trim());
        if (isNumeric && global.stklySearch[from]) {
            const stickerlyPath = path.join(__dirname, 'commands', 'descargas', 'stickerly.js');
            if (fs.existsSync(stickerlyPath)) {
                try {
                    // Limpiar el cache para evitar problemas
                    delete require.cache[require.resolve(stickerlyPath)];
                    const cmdStk = require(stickerlyPath);
                    
                    // Verificar que el comando existe y tiene run
                    if (cmdStk && typeof cmdStk.run === 'function') {
                        // Preparar los argumentos correctamente
                        const args = [body.trim()];
                        const prefix = config.prefixes[0];
                        
                        // Llamar al comando con todos los parámetros necesarios
                        return await cmdStk.run(socket, m, { 
                            args: args,
                            prefix: prefix,
                            from: from,
                            isGroup: isGroup,
                            sender: sender,
                            isOwner: isOwner,
                            isAdmins: isAdmins,
                            isBotAdmin: isBotAdmin,
                            body: body,
                            database: database
                        });
                    } else {
                        console.error("Stickerly no tiene función run");
                        delete global.stklySearch[from];
                    }
                } catch (e) { 
                    console.error("Error redirección stickerly:", e);
                    // Limpiar la búsqueda si hay error
                    delete global.stklySearch[from];
                    await socket.sendMessage(from, { 
                        text: "❌ Error al procesar tu selección. Por favor, vuelve a buscar." 
                    }, { quoted: m });
                }
            }
            return;
        }
        // ----------------------------------------------

        const isCommand = config.prefixes.some(p => body.startsWith(p));

        if (m.key.fromMe && !isCommand) return;

        if (isGroup && database.muted[from] && database.muted[from].includes(sender) && !isOwner) {
            try { await socket.sendMessage(from, { delete: m.key }); } catch (e) {}
            return;
        }
        if (isGroup && database.adminOnly && database.adminOnly.includes(from) && !isAdmins && !isOwner) return;

        const mentionId = botNumber.split('@')[0];
        const isMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(botNumber) || 
                            body.includes(`@${mentionId}`) ||
                            (m.message?.extendedTextMessage?.contextInfo?.participant === botNumber);

        if (((!isGroup) || (isGroup && isMentioned)) && !isCommand) {
            if (m.key.fromMe) return;

            let systemPrompt = "Eres un asistente.";
            const promptPath = path.join(__dirname, 'services', 'prompt.txt');
            if (fs.existsSync(promptPath)) {
                try { systemPrompt = fs.readFileSync(promptPath, 'utf-8'); } catch (e) {}
            }

            const cleanBody = body.replace(new RegExp(`@${mentionId}`, 'g'), '').trim();

            try {
                const aiRes = await axios.post(GROQ_URL, {
                    model: "llama-3.1-8b-instant",
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: cleanBody || "Hola" }],
                    temperature: 0.9
                }, { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }, timeout: 10000 });

                const respuesta = aiRes.data.choices[0].message.content.trim();
                return await socket.sendMessage(from, { text: respuesta }, { quoted: m });
            } catch (aiErr) { return; }
        }

        let msgWithPrefix = body;
        const prefix = config.prefixes.find(p => body.startsWith(p));
        if (!prefix && body) msgWithPrefix = config.prefixes[0] + body;

        const currentPrefix = prefix || config.prefixes[0];
        const args = msgWithPrefix.slice(currentPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (commandName === 'code') {
            const phoneNumber = args[0];
            if (!phoneNumber) return socket.sendMessage(from, { text: `> *Ejemplo: ${currentPrefix}code 50496228919*` }, { quoted: m });
            const numLimpio = phoneNumber.replace(/[^0-9]/g, '');
            await socket.sendMessage(from, { text: `⏳ *Generando código para +${numLimpio}...*` }, { quoted: m });
            if (global.startSubBot) await global.startSubBot(socket, m, numLimpio);
            return;
        }

        const commandsDir = path.join(__dirname, 'commands');
        if (fs.existsSync(commandsDir)) {
            const categories = fs.readdirSync(commandsDir);
            for (const category of categories) {
                const catPath = path.join(commandsDir, category);
                if (fs.existsSync(catPath) && fs.lstatSync(catPath).isDirectory()) {
                    const commandFiles = fs.readdirSync(catPath).filter(file => file.endsWith('.js'));
                    for (const file of commandFiles) {
                        try {
                            const cmd = require(path.join(catPath, file));
                            if (cmd && (cmd.name === commandName || (cmd.aliases && cmd.aliases.includes(commandName)))) {
                                if (typeof cmd.run === 'function') {
                                    return await cmd.run(socket, m, { 
                                        args, prefix: currentPrefix, from, isGroup, sender, isOwner, isAdmins, isBotAdmin, body, database 
                                    });
                                } else {
                                    console.error(`Comando ${file} no tiene función run`);
                                }
                            }
                        } catch (cmdErr) { console.error(`Error en ${file}:`, cmdErr.message); }
                    }
                }
            }
        }
    } catch (err) { console.error("Handler Error:", err); }
};

// EXPORTAR LA FUNCIÓN HANDLER
module.exports = handler;

// Guardar base de datos cada 5 minutos
setInterval(() => {
    try { fs.writeFileSync(dbPath, JSON.stringify(database, null, 2)); } catch (e) {}
}, 300000);