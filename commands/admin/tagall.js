module.exports = {
  name: "tagout",
  aliases: ["tagall", "todos", "mencionar"],
  description: "Menciona a todos los miembros del grupo en una lista",

  run: async (socket, m, { from, isGroup, sender, isOwner, args }) => {
    try {
      if (!isGroup) return;

      // --- Verificación de Administrador (Lógica DanteBot) ---
      const groupMetadata = await socket.groupMetadata(from);
      const participants = groupMetadata.participants;
      const isSenderAdmin = participants.find(p => p.id === sender)?.admin !== null;

      if (!isSenderAdmin && !isOwner) {
        return socket.sendMessage(from, { 
          text: "*GESTIÓN DE ADMIN*\n\n> *Error:* `Acceso Denegado`\n> *Info:* Solo administradores pueden usar este comando." 
        }, { quoted: m });
      }

      // --- Configuración del Mensaje ---
      const message = args.length > 0 ? args.join(" ") : "Sin mensaje específico";
      
      let list = "*INVOCACION AL GRUPO*\n\n";
      list += `> *Mensaje:* ${message}\n`;
      list += `> *Grupo:* ${groupMetadata.subject}\n\n`;
      list += "*LISTA DE INTEGRANTES:*\n";

      const mentions = [];
      participants.forEach((p) => {
        list += `> 》 @${p.id.split('@')[0]}\n`;
        mentions.push(p.id);
      });

      list += "\n> Made By 𝐙𝐳𝐚𝐰𝐗";

      // --- Enviar con el array de menciones ---
      return socket.sendMessage(from, { 
        text: list,
        mentions: mentions 
      }, { quoted: m });

    } catch (e) {
      // Error silencioso para no ensuciar el chat
    }
  }
};
