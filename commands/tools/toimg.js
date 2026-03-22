/**
 * Command: toimg
 * Category: tools
 * Description: Convierte stickers a Video/Imagen (Sin Thumbnails)
 */
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

module.exports = {
  name: "toimg",
  aliases: ["tovideo", "img"],
  category: "tools",
  description: "Convierte stickers a video o imagen.",

  run: async (socket, m, { from }) => {
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const isSticker = quoted?.stickerMessage;

    if (!isSticker) {
      return socket.sendMessage(from, { 
        text: "*[!] Responde a un sticker para convertirlo*" 
      }, { quoted: m });
    }

    await socket.sendMessage(from, { react: { text: "🕐", key: m.key } });

    const tmpDir = path.join(__dirname, "../../tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const uniqueId = Date.now();
    const inputPath = path.join(tmpDir, `sticker_${uniqueId}.webp`);
    const outputPath = path.join(tmpDir, `output_${uniqueId}.mp4`);
    const framesPath = path.join(tmpDir, `frame_${uniqueId}_%03d.png`);

    try {
      const buffer = await downloadMediaMessage(
        { message: quoted }, 
        "buffer", 
        {}, 
        { reuploadRequest: socket.updateMediaMessage }
      );
      fs.writeFileSync(inputPath, buffer);

      let command;
      if (isSticker.isAnimated) {
        // Conversión a video MP4 mediante extracción de frames
        command = `magick "${inputPath}" "${framesPath}" && ffmpeg -y -i "${framesPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2,format=yuv420p" -c:v libx264 -preset ultrafast -crf 28 "${outputPath}"`;
      } else {
        // Conversión simple a imagen PNG
        command = `magick "${inputPath}" "${outputPath.replace('.mp4', '.png')}"`;
      }

      exec(command, async (error) => {
        if (error) {
          console.error("CONVERSION ERROR:", error);
          cleanup(uniqueId, inputPath, outputPath, tmpDir);
          return socket.sendMessage(from, { text: "*[!] Error al procesar el sticker.*" }, { quoted: m });
        }

        const finalPath = isSticker.isAnimated ? outputPath : outputPath.replace('.mp4', '.png');
        const mediaBuffer = fs.readFileSync(finalPath);
        
        const config = {
          caption: "> *𝕯𝖆𝖓𝖙𝖊 𝕭𝖔𝖙 🇦🇱*",
          contextInfo: { 
            externalAdReply: { 
              title: "𝐒𝐭𝐢𝐜𝐤𝐞𝐫 𝐭𝐨 𝐌𝐞𝐝𝐢𝐚", 
              body: "𝐃𝐚𝐧𝐭𝐞 𝐁𝐨𝐭 - 𝐒𝐲𝐬𝐭𝐞𝐦", 
              sourceUrl: "𝐙⃯⃖𝐙⃯⃖𝐀⃯⃖𝐖⃯⃖𝐗⃯⃖.𝐂⃯⃖𝐎⃯⃖𝐌⃯⃖",
              mediaType: 1,
              renderLargerThumbnail: false
            }
          }
        };

        if (isSticker.isAnimated) {
          await socket.sendMessage(from, { video: mediaBuffer, ...config }, { quoted: m });
        } else {
          await socket.sendMessage(from, { image: mediaBuffer, ...config }, { quoted: m });
        }

        cleanup(uniqueId, inputPath, outputPath, tmpDir);
        await socket.sendMessage(from, { react: { text: "✔", key: m.key } });
      });

    } catch (e) {
      console.error(e);
      await socket.sendMessage(from, { text: "*[!] Error crítico.*" }, { quoted: m });
    }
  }
};

/**
 * Función de limpieza de archivos temporales
 */
function cleanup(id, input, output, dir) {
  if (fs.existsSync(input)) fs.unlinkSync(input);
  if (fs.existsSync(output)) fs.unlinkSync(output);
  if (fs.existsSync(output.replace('.mp4', '.png'))) fs.unlinkSync(output.replace('.mp4', '.png'));
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file.includes(`frame_${id}`)) {
      fs.unlinkSync(path.join(dir, file));
    }
  });
}
