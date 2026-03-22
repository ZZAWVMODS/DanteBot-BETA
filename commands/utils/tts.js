const googleTTS = require("google-tts-api");

module.exports = {
  name: "tts",
  aliases: ["voz", "decir"],
  category: "utils",
  description: "Convierte texto a audio.",

  run: async (socket, m, { args, from }) => {
    const text = args.join(" ");
    if (!text) return socket.sendMessage(from, { text: "*[!] Escribe el texto para convertir.*" }, { quoted: m });

    try {
      const url = googleTTS.getAudioUrl(text, { 
        lang: "es", 
        slow: false,
        host: "https://translate.google.com"
      });

      await socket.sendMessage(from, {
        audio: { url: url },
        mimetype: "audio/mpeg",
        ptt: true
      }, { quoted: m });

      await socket.sendMessage(from, { react: { text: "🇦🇱", key: m.key } });

    } catch (e) {
      console.error("TTS ERROR:", e);
      await socket.sendMessage(from, { text: "*[!] Error al generar el audio.*" }, { quoted: m });
    }
  }
};
