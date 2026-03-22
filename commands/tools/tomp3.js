const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const execPromise = promisify(exec);

module.exports = {
    name: "tomp3",
    aliases: ["mp3", "audio"],
    category: "tools",
    run: async (socket, m, { from }) => {
        try {
            // Detectar si es video directo o citado
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const videoMessage = m.message?.videoMessage || quoted?.videoMessage;

            if (!videoMessage) {
                return socket.sendMessage(from, { 
                    text: "*Responde a un video con el comando `.tomp3` para extraer el audio*" 
                }, { quoted: m });
            }

            await socket.sendMessage(from, { react: { text: "🕑", key: m.key } });

            // 1. Descargar el contenido como Stream
            const stream = await downloadContentFromMessage(videoMessage, 'video');
            
            // 2. Convertir Stream a Buffer
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Rutas temporales
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const inputPath = path.join(tempDir, `video_${Date.now()}.mp4`);
            const outputPath = path.join(tempDir, `audio_${Date.now()}.mp3`);

            // Guardar el buffer
            fs.writeFileSync(inputPath, buffer);

            // 3. Ejecutar FFmpeg OPTIMIZADO
            // -threads 0: usa todos los núcleos del CPU
            // -preset ultrafast: máxima velocidad de conversión
            // -q:a 0: mejor calidad posible en MP3 (0 = mejor, 9 = peor)
            // -ar 44100: frecuencia de muestreo estándar
            await execPromise(`ffmpeg -i "${inputPath}" -threads 0 -preset ultrafast -vn -acodec libmp3lame -ar 44100 -q:a 0 "${outputPath}"`);

            if (!fs.existsSync(outputPath)) throw new Error("Fallo la conversión");

            const audioBuffer = fs.readFileSync(outputPath);

            // 4. Enviar resultado
            await socket.sendMessage(from, { react: { text: "✔️", key: m.key } });
            await socket.sendMessage(from, { 
                audio: audioBuffer, 
                mimetype: 'audio/mpeg', 
                ptt: false 
            }, { quoted: m });

            // Limpieza
            [inputPath, outputPath].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });

        } catch (error) {
            console.error("Error en tomp3:", error);
            await socket.sendMessage(from, { react: { text: "✖️", key: m.key } });
            await socket.sendMessage(from, { text: "*Error:* No se pudo procesar el audio" }, { quoted: m });
        }
    }
};