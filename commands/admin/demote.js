module.exports = {
  name: "demote",
  aliases: ["quitaradmin", "degradar"],
  description: "Quitar administración a un usuario",

  run: async (socket, m, { args, from }) => {
    try {
      if (!from.includes('@g.us')) return;

      const mentionedUsers = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const replyLid = m.message?.extendedTextMessage?.contextInfo?.participant;
      
      let userId = replyLid || (mentionedUsers.length > 0 ? mentionedUsers[0] : null);
      if (!userId && args.length > 0) userId = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

      if (!userId) {
        return socket.sendMessage(from, { 
          text: "*GESTIÓN DE RANGOS* ⚙️\n\n> *Error:* `Usuario no detectado`\n> *Uso:* Menciona a alguien o responde a su mensaje." 
        }, { quoted: m });
      }

      await socket.groupParticipantsUpdate(from, [userId], "demote");

      await socket.sendMessage(from, { 
        text: "*RANGO ACTUALIZADO* 💀\n\n> *Acción:* `Degradar Administrador`\n> *Usuario:* @"+userId.split('@')[0]+"\n> *Estado:* `Participante común`",
        mentions: [userId]
      }, { quoted: m });

    } catch (e) {
      // Error silencioso
    }
  }
};
