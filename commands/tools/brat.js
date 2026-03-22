const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

module.exports = {
    name: "brat",
    aliases: ["txt", "sbrat"],
    category: "tools",
    run: async (socket, m, { args, prefix, from }) => {
        try {
            if (!args.length) {
                return await socket.sendMessage(from, { 
                    text: `Escribe el texto para el sticker.\n\nEjemplo: ${prefix}brat Hola`
                }, { quoted: m });
            }

            const text = args.join(" ");
            await socket.sendMessage(from, { react: { text: "🕒", key: m.key } });

            // 1. Obtener imagen
            const apiUrl = `https://api.yupra.my.id/api/image/brat?text=${encodeURIComponent(text)}`;
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            // Rutas temporales (ajustadas a tu storage)
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const inputPath = path.join(tempDir, `brat_${Date.now()}.png`);
            const outputPath = path.join(tempDir, `brat_${Date.now()}.webp`);

            fs.writeFileSync(inputPath, response.data);

            // 2. Convertir con FFmpeg (que ya deberías tenerlo en el sistema)
            // Esta línea asegura que sea un sticker transparente y del tamaño correcto
            await execPromise(`ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -lossless 1 -loop 0 -preset default -an -vsync 0 "${outputPath}"`);

            const buffer = fs.readFileSync(outputPath);

            // 3. Enviar
            await socket.sendMessage(from, { react: { text: "✔️", key: m.key } });
            await socket.sendMessage(from, { sticker: buffer }, { quoted: m });

            // Limpieza
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        } catch (error) {
            console.error('[BRAT ERROR]:', error);
            await socket.sendMessage(from, { 
                text: `❌ *Error:* Asegúrate de tener FFmpeg instalado o instala wa-sticker-formatter.`
            }, { quoted: m });
        }
    }
};
