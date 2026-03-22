const fs = require('fs');
const path = require('path');
const dbPath = './database.json';
const config = require('../../config');

module.exports = {
  name: "unmute",
  aliases: ["desilenciar"],
  description: "Permite que un usuario vuelva a enviar mensajes",

  run: async (socket, m, { args, from, isGroup, isAdmins, isOwner, database }) => {
    if (!isGroup) return;

    // RESTRICCIÓN: Solo Admins u Owner
    if (!isAdmins && !isOwner) {
      return socket.sendMessage(from, { text: "*[!] Error:* Solo los administradores pueden usar este comando." }, { quoted: m });
    }

    if (!database.muted) database.muted = {};
    if (!database.muted[from]) database.muted[from] = [];

    // Obtener el contexto del mensaje
    const contextInfo = m.message?.extendedTextMessage?.contextInfo;
    
    // CASO 1: Usuario respondido (reply)
    let userId = contextInfo?.participant || null;
    
    // CASO 2: Usuario mencionado (si no hay reply, buscar menciones)
    if (!userId && contextInfo?.mentionedJid && contextInfo.mentionedJid.length > 0) {
        userId = contextInfo.mentionedJid[0];
    }
    
    // CASO 3: Número en argumentos (si no hay reply ni mención)
    if (!userId && args.length > 0) {
        const cleanNumber = args[0].replace(/[^0-9]/g, '');
        if (cleanNumber.length >= 10) {
            userId = cleanNumber + '@s.whatsapp.net';
        }
    }

    // Si aún no hay usuario, mostrar error
    if (!userId) {
      return socket.sendMessage(from, { 
        text: "*SISTEMA DE SILENCIO* 🔊\n\n> *Error:* `Usuario no detectado`\n> *Uso:* Responde a un mensaje, menciona a alguien o escribe el número.\n> *Ejemplos:*\n> • !unmute (respondiendo)\n> • !unmute @usuario\n> • !unmute 50496228919" 
      }, { quoted: m });
    }

    if (!database.muted[from].includes(userId)) {
        return socket.sendMessage(from, { text: "*[!] Info:* Este usuario no estaba silenciado." }, { quoted: m });
    }

    database.muted[from] = database.muted[from].filter(id => id !== userId);
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));

    return socket.sendMessage(from, { 
      text: "*SISTEMA DE SILENCIO* 🔊\n\n> *Acción:* `Usuario Desilenciado`\n> *Usuario:* @" + userId.split('@')[0] + "\n> *Estado:* `Puede hablar de nuevo.`",
      mentions: [userId]
    }, { quoted: m });
  }
};