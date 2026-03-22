const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: "revelar",
  aliases: ["rv", "read"],
  description: "Revela multimedia de una sola vista con Debug",

  run: async (socket, m, { from, isGroup, sender, isOwner }) => {
    try {
      // 1. Verificación de permisos
      const groupMetadata = isGroup ? await socket.groupMetadata(from) : null;
      const isSenderAdmin = isGroup ? groupMetadata.participants.find(p => p.id === sender)?.admin !== null : true;
      if (!isSenderAdmin && !isOwner) return;

      // --- SECCIÓN DE DEBUG ---
      console.log("--- DEBUG REVELAR ---");
      const quotedContext = m.message?.extendedTextMessage?.contextInfo;
      console.log("¿Existe ContextInfo?:", !!quotedContext);
      console.log("¿Existe QuotedMessage?:", !!quotedContext?.quotedMessage);
      
      if (quotedContext?.quotedMessage) {
        console.log("Keys del Quoted:", Object.keys(quotedContext.quotedMessage));
        // Imprime la estructura para ver si WhatsApp cambió el nombre del nodo
        console.log("Estructura Quoted:", JSON.stringify(quotedContext.quotedMessage, null, 2));
      }
      // ------------------------

      const quoted = quotedContext?.quotedMessage;
      
      // Búsqueda recursiva del mensaje de una sola vista
      const viewOnce = quoted?.viewOnceMessageV2?.message || 
                       quoted?.viewOnceMessage?.message || 
                       quoted?.viewOnceMessageV2Extension?.message ||
                       quoted; // Intentar directo si no viene envuelto

      // Detectar tipos
      const isImage = !!(viewOnce?.imageMessage);
      const isVideo = !!(viewOnce?.videoMessage);
      const isAudioVO = !!(viewOnce?.audioMessage || viewOnce?.audioMessage?.viewOnce || quoted?.audioMessage?.viewOnce);

      console.log("Resultados de detección:", { isImage, isVideo, isAudioVO });

      if (!isImage && !isVideo && !isAudioVO) {
        return socket.sendMessage(from, { 
          text: "❌ *DanteBot Debug:* No se detectó contenido de una vista. Revisa la consola de Termux." 
        }, { quoted: m });
      }

      await socket.sendMessage(from, { react: { text: "🕑", key: m.key } });

      // Seleccionar el contenido correcto
      const messageContent = viewOnce?.imageMessage || viewOnce?.videoMessage || viewOnce?.audioMessage || quoted?.audioMessage;
      const type = isImage ? "image" : isVideo ? "video" : "audio";

      const stream = await downloadContentFromMessage(messageContent, type);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      let mediaCaption = `『 𝐃𝐀𝐍𝐓𝐄 𝐁𝐎𝐓 - 𝐑𝐄𝐕𝐄𝐋𝐀𝐑 』\n\n`;
      mediaCaption += ` ⧉ *𝚃𝚒𝚙𝚘:* ${isImage ? "ɪᴍᴀɢᴇɴ 📸" : isVideo ? "ᴠɪᴅᴇᴏ 🎥" : "ᴀᴜᴅɪᴏ 🎙️"}\n`;
      mediaCaption += ` ⧉ *𝚂𝚝𝚊𝚝𝚞𝚜:* ᴇxᴛʀᴀɪᴅᴏ ✓\n\n`;
      mediaCaption += `> 𝐌𝐚𝐝𝐞 𝐁𝐲 𝐙𝐳𝐚𝐰𝐗𝐭`;

      if (isImage) {
        await socket.sendMessage(from, { image: buffer, caption: mediaCaption }, { quoted: m });
      } else if (isVideo) {
        await socket.sendMessage(from, { video: buffer, caption: mediaCaption, mimetype: 'video/mp4' }, { quoted: m });
      } else if (isAudioVO) {
        await socket.sendMessage(from, { 
          audio: buffer, 
          mimetype: 'audio/mp4', 
          ptt: true,
          contextInfo: {
            externalAdReply: {
              title: `𝐀𝐮𝐝𝐢𝐨 𝐑𝐞𝐯𝐞𝐥𝐚𝐝𝐨 - 𝐃𝐚𝐧𝐭𝐞𝐁𝐨𝐭`,
              body: `мɛиc𝐢σи ɢƖσвαƖ`,
              mediaType: 1,
              sourceUrl: `https://www.SkilletX.com`
            }
          }
        }, { quoted: m });
      }

      await socket.sendMessage(from, { react: { text: "✔️", key: m.key } });

    } catch (error) {
      console.error("Error crítico en revelar:", error);
      socket.sendMessage(from, { text: "*System Failure:* Error al interceptar el mensaje." });
    }
  }
};
