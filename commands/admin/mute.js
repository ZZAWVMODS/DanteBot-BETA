const fs = require('fs');
const path = require('path');
const dbPath = './database.json';
const config = require('../../config');

module.exports = {
  name: "mute",
  aliases: ["silenciar"],
  description: "Silencia a un usuario en el grupo",

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
        text: "*SISTEMA DE SILENCIO* 🔇\n\n> *Error:* `Usuario no detectado`\n> *Uso:* Responde a un mensaje, menciona a alguien o escribe el número.\n> *Ejemplos:*\n> • !mute (respondiendo)\n> • !mute @usuario\n> • !mute 50496228919" 
      }, { quoted: m });
    }

    // No permitir silenciar al owner
    if (userId.includes(config.ownerNumber) || userId === config.ownerJid || userId === config.ownerLid) {
      return socket.sendMessage(from, { text: "*[!] Error:* No puedes silenciar al propietario del bot." }, { quoted: m });
    }

    // No permitir silenciar al bot
    if (userId === socket.user.id) {
      return socket.sendMessage(from, { text: "*[!] Error:* No puedes silenciar al bot." }, { quoted: m });
    }

    if (database.muted[from].includes(userId)) {
        return socket.sendMessage(from, { text: "*[!] Info:* Este usuario ya está silenciado." }, { quoted: m });
    }

    database.muted[from].push(userId);
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));

    return socket.sendMessage(from, { 
      text: "*SISTEMA DE SILENCIO* 🔇\n\n> *Acción:* `Usuario Silenciado`\n> *Usuario:* @" + userId.split('@')[0] + "\n> *Info:* `Sus mensajes serán eliminados automáticamente.`",
      mentions: [userId]
    }, { quoted: m });
  }
};