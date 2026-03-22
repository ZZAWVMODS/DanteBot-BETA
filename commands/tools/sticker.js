const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const { processStaticSticker, processAnimatedSticker } = require("../../services/sticker");

module.exports = {
  name: "sticker",
  aliases: ["s", "f", "fig"],
  category: "tools",
  description: "Crea stickers de imagen o video para Dante Bot.",

  run: async (socket, m, { prefix, from, sender }) => {
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const isImage = m.message?.imageMessage || quoted?.imageMessage;
    const isVideo = m.message?.videoMessage || quoted?.videoMessage;

    if (!isImage && !isVideo) {
      return socket.sendMessage(from, { 
        text: `*[!] Responde a una imagen o video corto para crear un sticker*\n\n\`Ejemplo:\` ${prefix}sticker` 
      }, { quoted: m });
    }

    await socket.sendMessage(from, { react: { text: "🕒", key: m.key } });

    const tmpDir = path.join(__dirname, "../../tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    const inputPath = path.join(tmpDir, `raw_${Date.now()}`);

    try {
      const messageToDownload = quoted ? { message: quoted } : m;
      const buffer = await downloadMediaMessage(messageToDownload, "buffer", {}, { reuploadRequest: socket.updateMediaMessage });
      fs.writeFileSync(inputPath, buffer);

      const metadata = {
        username: "𝐃𝐚𝐧𝐭𝐞 𝐁𝐨𝐭 𝐒𝐨𝐜𝐤𝐞𝐭",
        botName: `\n\n𝗨𝘀𝗲𝗿: ${m.pushName || sender.split('@')[0]}\n\n𝗗𝗔𝗡𝗧𝗘 𝗕𝗢𝗧 🇦🇱`
      };

      let stickerPath = isImage 
        ? await processStaticSticker(inputPath, metadata) 
        : await processAnimatedSticker(inputPath, metadata);

      const stickerBuffer = fs.readFileSync(stickerPath);
      
      await socket.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });
      await socket.sendMessage(from, { react: { text: "✔", key: m.key } });

      // Limpieza de archivos temporales
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(stickerPath)) fs.unlinkSync(stickerPath);

    } catch (e) {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      console.error(e);
      await socket.sendMessage(from, { text: `*Error:* ${e.message}` }, { quoted: m });
    }
  }
};
