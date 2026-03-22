module.exports = {
  name: "open",
  aliases: ["abrir"],
  run: async (socket, m, { from }) => {
    try {
      // Intenta abrir el grupo directamente
      await socket.groupSettingUpdate(from, "not_announcement");
      
      return socket.sendMessage(from, { 
        text: "*ESTADO DEL GRUPO* 🔓\n\n> *Acción:* `Grupo Abierto`\n> *Info:* Todos los participantes pueden enviar mensajes ahora." 
      }, { quoted: m });

    } catch (error) {
      // Si falla, es porque el emisor o el bot no son admins
      return socket.sendMessage(from, { 
        text: "*[!] Error:* Para abrir el grupo se necesita ser administrador." 
      }, { quoted: m });
    }
  }
};
