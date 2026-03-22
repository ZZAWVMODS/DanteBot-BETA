module.exports = {
  name: "promote",
  aliases: ["daradmin", "admin"],
  description: "Dar administración a un usuario",

  run: async (socket, m, { args, from }) => {
    try {
      if (!from.includes('@g.us')) return;

      // Lógica de detección: Respondido > Mencionado > Argumento
      const mentionedUsers = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const replyLid = m.message?.extendedTextMessage?.contextInfo?.participant;
      
      let userId = replyLid || (mentionedUsers.length > 0 ? mentionedUsers[0] : null);
      if (!userId && args.length > 0) userId = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

      if (!userId) {
        return socket.sendMessage(from, { 
          text: "*GESTIÓN DE RANGOS* ⚙️\n\n> *Error:* `Usuario no detectado`\n> *Uso:* Menciona a alguien o responde a su mensaje." 
        }, { quoted: m });
      }

      // Ejecución de la acción
      await socket.groupParticipantsUpdate(from, [userId], "promote");

      // Diseño Visual DanteBot
      await socket.sendMessage(from, { 
        text: "*RANGO ACTUALIZADO* 👑\n\n> *Acción:* `Promover Participante`\n> *Usuario:* @"+userId.split('@')[0]+"\n> *Estado:* `Nuevo Administrador`",
        mentions: [userId]
      }, { quoted: m });

    } catch (e) {
      // Error silencioso
    }
  }
};
