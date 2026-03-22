module.exports = {
    name: "screenshot",
    aliases: ["ss", "webshot", "fullss"],
    category: "tools",
    run: async (socket, m, { args, from, prefix }) => {
        
        // Verificamos si ingresó una URL
        if (!args[0]) {
            return socket.sendMessage(from, { 
                text: `\`S C R E E N S H O T\`\n\n> _Error: Ingrese la URL de una página._\n> _Ej: ${prefix}ss https://google.com_` 
            }, { quoted: m });
        }

        // Limpiamos la URL (por si el usuario no pone el https://)
        let url = args[0];
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        try {
            // Notificamos que el sistema está procesando la captura
            await socket.sendMessage(from, { text: `> _Capturando pantalla..._` }, { quoted: m });

            const apiEndpoint = `https://api.popcat.xyz/v2/screenshot?url=${encodeURIComponent(url)}`;

            // Enviamos la imagen directamente desde la URL de la API
            await socket.sendMessage(from, { 
                image: { url: apiEndpoint }, 
                caption: `\`S C R E E N S H O T\`\n\n> *URL:* ${url}\n\n_System process complete._` 
            }, { quoted: m });

        } catch (error) {
            console.error(error);
            await socket.sendMessage(from, { 
                text: `\`S C R E E N S H O T\`\n\n> _Error: No se pudo capturar la página._` 
            }, { quoted: m });
        }
    }
};
