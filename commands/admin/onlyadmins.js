module.exports = {
    name: "onlyadmin",
    aliases: ["soloadmin", "soloadmins", "onlyadmins"],
    category: "admin",
    run: async (socket, m, { from, isGroup, isAdmins, isOwner, database }) => {
        
        // Verificaciones de seguridad
        if (!isGroup) return;
        if (!isAdmins && !isOwner) return await socket.sendMessage(from, { text: `*[!] Solo administradores pueden usar este comando*` }, { quoted: m });

        // Inicializar el array si no existe en la base de datos
        if (!database.adminOnly) database.adminOnly = [];

        let status;
        if (database.adminOnly.includes(from)) {
            // Si ya está, lo quitamos (Desactivar)
            database.adminOnly = database.adminOnly.filter(id => id !== from);
            status = "DESACTIVADO";
        } else {
            // Si no está, lo agregamos (Activar)
            database.adminOnly.push(from);
            status = "ACTIVADO";
        }

        // Diseño minimalista
        let text = `\`A D M I N  O N L Y\`\n\n` +
                   `*_Restricción de sistema_*\n` +
                   `\`Estado:\` *${status}*\n\n` +
                   `> _*Puto el que lea xd*_`;

        await socket.sendMessage(from, { text: text }, { quoted: m });
    }
};
