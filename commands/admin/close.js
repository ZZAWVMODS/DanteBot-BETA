module.exports = {
  name: "close",
  aliases: ["cerrar"],
  run: async (socket, m, { from }) => {
    try {
      // Intenta cerrar el grupo directamente
      await socket.groupSettingUpdate(from, "announcement");
      
      return socket.sendMessage(from, { 
        text: "*ESTADO DEL GRUPO* 🔒\n\n> *Acción:* `Grupo Cerrado`\n> *Info:* Solo los administradores pueden enviar mensajes." 
      }, { quoted: m });

    } catch (error) {
      // Si falla, es porque el emisor o el bot no son admins
      return socket.sendMessage(from, { 
        text: "*[!] Error:* Para cerrar el grupo se necesita ser administrador." 
      }, { quoted: m });
    }
  }
};
