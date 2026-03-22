/**
 * Command: link
 * Category: Utils
 * Status: Non-strict
 */
module.exports = {
  name: "link",
  aliases: ["linkgroup", "enlace"],
  category: "utils",
  description: "Obtén el enlace de invitación del grupo.",

  run: async (socket, m, { from, isGroup }) => {
    if (!isGroup) return; 

    try {
      // Intentar obtener el código sin verificar 'isBotAdmin' antes
      const code = await socket.groupInviteCode(from);
      const link = `https://chat.whatsapp.com/${code}`;

      const texto = `*🔗 𝐄𝐍𝐋𝐀𝐂𝐄 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎*\n\n` +
                    `*Link:* ${link}\n\n` +
                    `> *𝕯𝖆𝖓𝖙𝖊 𝕭𝖔𝖙 🇦🇱*`;

      await socket.sendMessage(from, { 
        text: texto,
        contextInfo: { 
          externalAdReply: { 
            title: '𝐆𝐫𝐨𝐮𝐩 𝐈𝐧𝐯𝐢𝐭𝐞 𝐋𝐢𝐧𝐤', 
            body: '𝐃𝐚𝐧𝐭𝐞 𝐁𝐨𝐭 - 𝐒𝐲𝐬𝐭𝐞𝐦', 
            thumbnailUrl: 'https://cdn.russellxz.click/40514e02.jpeg', 
            sourceUrl: '𝐙⃯⃖𝐙⃯⃖𝐀⃯⃖𝐖⃯⃖𝐗⃯⃖.𝐂⃯⃖𝐎⃯⃖𝐌⃯⃖' 
          }
        }
      }, { quoted: m });

      await socket.sendMessage(from, { react: { text: "🔗", key: m.key } });

    } catch (e) {
      // Si falla (por no ser admin), enviamos un mensaje simple sin bloquear el comando
      await socket.sendMessage(from, { text: `*![!] No se pudo generar el enlace (¿Soy admin?)*` }, { quoted: m });
    }
  }
};
