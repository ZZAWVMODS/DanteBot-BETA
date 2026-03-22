const fs = require('fs');
const path = require('path');

module.exports = {
    name: "comandos",
    aliases: ["total", "count"],
    category: "main",
    run: async (socket, m, { from }) => {
        
        // Definimos la ruta de tu carpeta principal de comandos
        const dir = path.join(__dirname, '../../commands'); 
        
        let total = 0;

        // Función para leer carpetas y subcarpetas (recursivo)
        const countCommands = (directory) => {
            const files = fs.readdirSync(directory);
            for (const file of files) {
                const fullPath = path.join(directory, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    countCommands(fullPath); // Entra en subcarpetas (ff, info, etc)
                } else if (file.endsWith('.js')) {
                    total++; // Cuenta el archivo si termina en .js
                }
            }
        };

        try {
            countCommands(dir);
        } catch (e) {
            // Si la ruta anterior falla, intentamos con una ruta relativa común
            try { countCommands('./commands'); } catch (err) { total = "Error"; }
        }

        let text = `\`C O M M A N D S\`\n\n` +
                   `*_N° De comandos cargados_*\n` +
                   `\`Total de funciones:\` *${total}*\n\n` +
                   `> _Ready to execute._`;

        await socket.sendMessage(from, { 
            text: text 
        }, { quoted: m });
    }
};
