module.exports = {
  name: "delete",
  aliases: ["del", "borrar"],
  description: "Elimina mensajes",

  run: async (socket, m, { from, isGroup, sender, isOwner }) => {
    try {
      if (!isGroup) return;

      // Validación de admin para poder borrar mensajes de otros
      const groupMetadata = await socket.groupMetadata(from);
      const participants = groupMetadata.participants;
      const isSenderAdmin = participants.find(p => p.id === sender)?.admin !== null;

      if (!isSenderAdmin && !isOwner) return;

      const quoted = m.message?.extendedTextMessage?.contextInfo;
      
      if (quoted && quoted.stanzaId) {
        // 1. Borrar el mensaje al que respondes
        await socket.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: quoted.participant === (socket.user.id.split(':')[0] + '@s.whatsapp.net'),
            id: quoted.stanzaId,
            participant: quoted.participant
          }
        });

        // 2. Borrar tu propio comando (el ".delete")
        await socket.sendMessage(from, { delete: m.key });
      }
    } catch (e) {
      // Sin logs para evitar llenar la consola
    }
  }
};
