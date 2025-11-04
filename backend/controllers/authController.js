const db = require('../models/db');

// Registro (solo para pacientes)
exports.registro = (req, res) => {
    const { nombre, apellido, email, contrasena, tipo, obra_social, detalles_extras } = req.body;

    if (tipo !== 'paciente') {
        return res.status(400).json({ mensaje: 'Solo se puede registrar como paciente desde esta vía.' });
    }

    const sql = `
        INSERT INTO usuarios (nombre, apellido, email, contrasena, tipo, obra_social, detalles_extras)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [nombre, apellido, email, contrasena, tipo, obra_social, detalles_extras], (err, resultado) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al registrar usuario.' });
        }
        res.status(201).json({ mensaje: 'Usuario registrado correctamente.' });
    });
};

// Login
exports.login = (req, res) => {
    const { email, contrasena } = req.body;

    const sql = 'SELECT * FROM usuarios WHERE email = ? AND contrasena = ?';
    db.query(sql, [email, contrasena], (err, resultados) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error en el servidor.' });
        }

        if (resultados.length === 0) {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
        }

        const usuario = resultados[0];

        res.status(200).json({
            mensaje: 'Login exitoso.',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                tipo: usuario.tipo
            }
        });
    });
};
