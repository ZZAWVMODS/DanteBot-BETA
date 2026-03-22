const fs = require('fs');
const path = require('path');
const config = require('../../config');

module.exports = {
    name: "update",
    alises: ["up"],
    run: async (socket, m, { from, isOwner }) => {
        
        if (!isOwner) {
            return socket.sendMessage(from, { 
                text: "*[!] ACCESO DENEGADO*" 
            }, { quoted: m });
        }

        try {
            const commandsDir = path.join(__dirname, '../../commands');
            const categories = fs.readdirSync(commandsDir);
            let filesUpdated = 0;

            for (const category of categories) {
                const categoryPath = path.join(commandsDir, category);
                
                if (fs.lstatSync(categoryPath).isDirectory()) {
                    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));
                    
                    for (const file of files) {
                        const filePath = path.join(categoryPath, file);
                        delete require.cache[require.resolve(filePath)];
                        filesUpdated++;
                    }
                }
            }

            const handlerPath = path.resolve(__dirname, '../../handler.js');
            const configPath = path.resolve(__dirname, '../../config.js');
            
            if (fs.existsSync(handlerPath)) delete require.cache[require.resolve(handlerPath)];
            if (fs.existsSync(configPath)) delete require.cache[require.resolve(configPath)];

            let msg = `*HOT-RELOAD COMPLETADO* ✅\n\n`;
            msg += `> *Estado:* \`Sincronizado\`\n`;
            msg += `> *Archivos:* \`${filesUpdated} comandos\`\n`;
            msg += `> *Backup:* \`Desactivado\`\n\n`;
            msg += `_Cambios aplicados de forma exitosa_`;

            await socket.sendMessage(from, { text: msg }, { quoted: m });

        } catch (err) {
            await socket.sendMessage(from, { 
                text: `*❌ ERROR:* \n\n\`\`\`${err.message}\`\`\`` 
            }, { quoted: m });
        }
    }
};
