module.exports = {
  name: "top",
  aliases: ["top10"],
  category: "main",
  description: "Muestra un top 10 aleatorio del grupo.",

  run: async (socket, m, { args, from, isGroup }) => {
    // 1. Verificación de Grupo
    if (!isGroup) {
      return socket.sendMessage(from, { 
        text: `*[!] Este comando es exclusivo para grupos*` 
      }, { quoted: m });
    }

    try {
      // 2. Obtener participantes
      const groupMetadata = await socket.groupMetadata(from);
      const participants = groupMetadata.participants;
      
      // 3. Definir contexto (Si no hay, usar uno genérico)
      const contexto = args.join(" ") || "Pendejos del Grupo";

      // 4. Selección aleatoria de 10 participantes
      const shuffled = participants.sort(() => 0.5 - Math.random());
      const topTen = shuffled.slice(0, 10);

      // 5. Construcción del mensaje con estética Dante Bot
      let mensaje = `*🏆 𝐓𝐎𝐏 𝟏𝟎 ${contexto.toUpperCase()} 🏆*\n\n`;
      let mentions = [];

      topTen.forEach((user, index) => {
        // Iconos por ranking
        const icon = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🔹";
        mensaje += `${icon} *${index + 1}.* @${user.id.split("@")[0]}\n`;
        mentions.push(user.id);
      });

      mensaje += `\n> *𝕯𝖆𝖓𝖙𝖊 𝕭𝖔𝚝 🇦🇱*`;

      // 6. Envío con ExternalAdReply (Banner FIX)
      await socket.sendMessage(from, { 
        text: mensaje,
        mentions: mentions,
        contextInfo: { 
          externalAdReply: { 
            title: `𝐑𝐚𝐧𝐤𝐢𝐧𝐠 ${contexto}`, 
            body: '𝐃𝐚𝐧𝐭𝐞 𝐁𝐨𝐭 🇦🇱', 
            // FIX: Se cambió la URL caída por la de Catbox
            thumbnailUrl: 'https://cdn.russellxz.click/40514e02.jpeg',
            // Mantenemos tu sourceUrl personalizado
            sourceUrl: '𝐙⃯⃖𝐙⃯⃖𝐀⃯⃖𝐖⃯⃖𝐗⃯⃖.𝐂⃯⃖𝐎⃯⃖𝐌⃯⃖' 
          }
        }
      }, { quoted: m });

      // Reacción de éxito
      await socket.sendMessage(from, { react: { text: "🇦🇱", key: m.key } });

    } catch (e) {
      console.error("Error en Top Dante Bot:", e);
      await socket.sendMessage(from, { text: `Error: ${e.message}` }, { quoted: m });
    }
  }
};
