const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: "tag",
  aliases: ["hidetag", "n"],
  description: "Mención invisible universal limpia",

  run: async (socket, m, { from, isGroup, sender, isOwner, args }) => {
    try {
      if (!isGroup) return;

      // 1. Validación de Admin (Lógica interna del Bot)
      const groupMetadata = await socket.groupMetadata(from);
      const participants = groupMetadata.participants;
      const isSenderAdmin = participants.find(p => p.id === sender)?.admin !== null;
      if (!isSenderAdmin && !isOwner) return;

      const users = participants.map(p => p.id);
      const contentText = args.length > 0 ? args.join(" ") : "";
      
      // 2. Extracción de mensaje citado (quoted)
      const quotedContext = m.message?.extendedTextMessage?.contextInfo;
      const quotedMsg = quotedContext?.quotedMessage;

      // FUNCIÓN DE ENVÍO LIMPIO (Extraída de tu ejemplo)
      const sendTag = async (content) => {
        return socket.sendMessage(from, {
          ...content,
          mentions: users,
          contextInfo: { 
            mentionedJid: users,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363422471539761@newsletter",
              serverMessageId: 0,
              newsletterName: "𝐓𝐢𝐦𝐞 𝐙𝐳𝐚𝐰𝐗 𝕭𝖔𝖙"
            }
          }
        });
      };

      if (quotedMsg) {
        // Detectar tipo de mensaje (imageMessage, videoMessage, audioMessage, etc.)
        const msgType = Object.keys(quotedMsg).find(k => k.endsWith('Message') && !k.includes('protocol'));

        if (msgType && msgType !== 'extendedTextMessage' && msgType !== 'conversation') {
          // CASO MULTIMEDIA: Descarga y reenvío con buffer (Tu lógica de ejemplo)
          const mediaType = msgType.replace('Message', '');
          const stream = await downloadContentFromMessage(quotedMsg[msgType], mediaType);
          let buffer = Buffer.from([]);
          for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

          const captionText = quotedMsg[msgType].caption || contentText || "";

          return sendTag({
            [mediaType]: buffer,
            mimetype: quotedMsg[msgType].mimetype,
            caption: captionText
          });
        } else {
          // CASO TEXTO: Extraer texto del mensaje citado
          const quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || contentText || "";
          return sendTag({ text: quotedText });
        }
      }

      // CASO SIN RESPUESTA: Solo texto directo
      if (contentText) {
        return sendTag({ text: contentText });
      }

    } catch (e) {
      // Error silencioso
    }
  }
};
