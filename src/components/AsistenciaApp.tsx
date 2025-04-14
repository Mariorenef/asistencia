import { db } from "../src/firebaseConfig";
import { collection, addDoc, getDocs, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth } from "../src/firebaseConfig";
import { useState, useEffect } from 'react';
import '../App.css';
import Login from './login';
import GraficoAsistencia from '../components/GraficoAsistencia';

export default function AsistenciaApp() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [alumnos, setAlumnos] = useState<{ nombre: string, grupo: string }[]>([]);
    const [asistencias, setAsistencias] = useState<Record<string, string>>({});
    const [nuevoAlumno, setNuevoAlumno] = useState('');
    const [grupo, setGrupo] = useState('A1');
    const [grupoSeleccionado, setGrupoSeleccionado] = useState('A1');
    const [mensaje, setMensaje] = useState('');
    const [fecha, setFecha] = useState(() => {
        const hoy = new Date();
        return hoy.toISOString().split('T')[0];
    });
    const [cargaMasiva, setCargaMasiva] = useState('');
    const [alumnoEditando, setAlumnoEditando] = useState<string | null>(null);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevoGrupo, setNuevoGrupo] = useState('A1');

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "alumnos"), (snapshot) => {
            const lista = snapshot.docs.map(doc => doc.data() as { nombre: string, grupo: string });
            setAlumnos(lista);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const cargarAsistencias = async () => {
            const snapshot = await getDocs(collection(db, "asistencias"));
            const asistenciasDelDia: Record<string, string> = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.fecha === fecha) {
                    asistenciasDelDia[data.alumno] = data.estado;
                }
            });
            setAsistencias(asistenciasDelDia);
            setTimeout(() => setLoading(false), 800);
        };
        cargarAsistencias();
    }, [fecha]);

    const marcar = async (nombre: string, estado: string) => {
        const snapshot = await getDocs(collection(db, "asistencias"));
        const existing = snapshot.docs.find(
            doc => doc.data().fecha === fecha && doc.data().alumno === nombre
        );

        if (existing) {
            await deleteDoc(doc(db, "asistencias", existing.id));
        }

        await addDoc(collection(db, "asistencias"), {
            fecha,
            alumno: nombre,
            estado
        });

        setAsistencias(prev => ({
            ...prev,
            [nombre]: estado
        }));
    };

    const agregarAlumno = async () => {
        const nombre = nuevoAlumno.trim();
        if (nombre && !alumnos.find(a => a.nombre === nombre)) {
            await addDoc(collection(db, "alumnos"), { nombre, grupo });
            setNuevoAlumno('');
            setMensaje(`Alumno "${nombre}" agregado al grupo "${grupo}" ✅`);
            setTimeout(() => setMensaje(''), 2500);
        }
    };

    const cargarAlumnosMasivos = async () => {
        const lineas = cargaMasiva.split('\n');
        for (let linea of lineas) {
            const [nombre, grupo] = linea.split(',').map(p => p.trim());
            if (nombre && grupo) {
                const yaExiste = alumnos.some(a => a.nombre === nombre);
                if (!yaExiste) {
                    await addDoc(collection(db, "alumnos"), { nombre, grupo });
                }
            }
        }
        setCargaMasiva('');
        setMensaje("Carga masiva completada ✅");
        setTimeout(() => setMensaje(''), 3000);
    };

    const eliminarAlumno = async (nombre: string) => {
        const snapshot = await getDocs(collection(db, "alumnos"));
        const docToDelete = snapshot.docs.find(doc => doc.data().nombre === nombre);
        if (docToDelete) {
            await deleteDoc(doc(db, "alumnos", docToDelete.id));
        }
    };

    const editarAlumno = async () => {
        const snapshot = await getDocs(collection(db, "alumnos"));
        const docToEdit = snapshot.docs.find(doc => doc.data().nombre === alumnoEditando);
        if (docToEdit && nuevoNombre.trim()) {
            await updateDoc(doc(db, "alumnos", docToEdit.id), {
                nombre: nuevoNombre.trim(),
                grupo: nuevoGrupo
            });
            setAlumnoEditando(null);
            setNuevoNombre('');
        }
    };

    const handleLogout = () => {
        signOut(auth)
            .then(() => {
                setIsAuthenticated(false);
            })
            .catch((error) => {
                console.error("Error al cerrar sesión:", error);
            });
    };

    if (loading) {
        return (
            <div className="login-container">
                <p>Cargando datos... ⏳</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLogin={() => setIsAuthenticated(true)} />;
    }

    const alumnosDelGrupo = alumnos.filter(a => a.grupo === grupoSeleccionado);

    return (
        <div className="app-container">
            <div className="header">
                <h1>Asistencia - C&E English</h1>
                <button onClick={handleLogout}>Cerrar sesión</button>
            </div>

            <div className="fecha-input">
                <label>
                    Fecha:
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                    />
                </label>
            </div>

            <div className="filtros-grupo">
                <label>
                    Filtrar nivel:
                    <select value={grupoSeleccionado} onChange={(e) => setGrupoSeleccionado(e.target.value)}>
                        <option value="A1">A1 - Beginner</option>
                        <option value="A2">A2 - Basic</option>
                        <option value="B1">B1 - Pre-intermediate</option>
                        <option value="B2">B2 - Intermediate</option>
                        <option value="C1">C1 - Upper-intermediate</option>
                        <option value="C2">C2 - Advanced</option>
                    </select>
                </label>
            </div>

            <div className="agregar-alumno">
                {mensaje && <p style={{ color: 'green', fontWeight: 'bold' }}>{mensaje}</p>}
                <input
                    type="text"
                    autoComplete="off"
                    onKeyDown={(e) => e.key === 'Enter' && agregarAlumno()}
                    value={nuevoAlumno}
                    onChange={(e) => setNuevoAlumno(e.target.value)}
                    placeholder="Nombre del alumno"
                />
                <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Basic</option>
                    <option value="B1">B1 - Pre-intermediate</option>
                    <option value="B2">B2 - Intermediate</option>
                    <option value="C1">C1 - Upper-intermediate</option>
                    <option value="C2">C2 - Advanced</option>
                </select>
                <button onClick={agregarAlumno}>Agregar</button>
            </div>

            <div className="carga-masiva">
                <h3>Carga masiva de alumnos</h3>
                <textarea
                    rows={5}
                    placeholder="Ej: Juan Pérez,A2\nLaura Gómez,B1"
                    value={cargaMasiva}
                    onChange={(e) => setCargaMasiva(e.target.value)}
                />
                <button onClick={cargarAlumnosMasivos}>Cargar alumnos</button>
            </div>

            <div className="secciones-asistencia">
                <div>
                    <h3>✅ Presentes ({alumnosDelGrupo.filter(n => asistencias[n.nombre] === 'Presente').length})</h3>
                    <ul className="lista-alumnos">
                        {alumnosDelGrupo.filter(n => asistencias[n.nombre] === 'Presente').map(({ nombre }) => (
                            <li key={nombre} className="alumno-item">
                                <strong>{nombre}</strong>
                                <div className="botones-asistencia">
                                    <button className="presente activo" onClick={() => marcar(nombre, 'Presente')}>Presente</button>
                                    <button className="ausente" onClick={() => marcar(nombre, 'Ausente')}>Ausente</button>
                                    <button className="eliminar" onClick={() => eliminarAlumno(nombre)}>Eliminar</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3>❌ Ausentes ({alumnosDelGrupo.filter(n => asistencias[n.nombre] === 'Ausente').length})</h3>
                    <ul className="lista-alumnos">
                        {alumnosDelGrupo.filter(n => asistencias[n.nombre] === 'Ausente').map(({ nombre }) => (
                            <li key={nombre} className="alumno-item">
                                <strong>{nombre}</strong>
                                <div className="botones-asistencia">
                                    <button className="presente" onClick={() => marcar(nombre, 'Presente')}>Presente</button>
                                    <button className="ausente activo" onClick={() => marcar(nombre, 'Ausente')}>Ausente</button>
                                    <button className="eliminar" onClick={() => eliminarAlumno(nombre)}>Eliminar</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3>🟡 Sin marcar ({alumnosDelGrupo.filter(n => !asistencias[n.nombre]).length})</h3>
                    <ul className="lista-alumnos">
                        {alumnosDelGrupo.filter(n => !asistencias[n.nombre]).map(({ nombre }) => (
                            <li key={nombre} className="alumno-item">
                                <strong>{nombre}</strong>
                                <div className="botones-asistencia">
                                    <button className="presente" onClick={() => marcar(nombre, 'Presente')}>Presente</button>
                                    <button className="ausente" onClick={() => marcar(nombre, 'Ausente')}>Ausente</button>
                                    <button className="eliminar" onClick={() => eliminarAlumno(nombre)}>Eliminar</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <button
                style={{ marginBottom: '20px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#1976d2', color: 'white', border: 'none' }}
                onClick={() => {
                    const csv = ['Nombre,Estado'];
                    alumnosDelGrupo.forEach(({ nombre }) => {
                        const estado = asistencias[nombre] || 'Sin marcar';
                        csv.push(`${nombre},${estado}`);
                    });
                    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `asistencia-${fecha}.csv`;
                    link.click();
                }}
            >
                📥 Descargar resumen CSV
            </button>

            <div className="resumen">
                <GraficoAsistencia
                    presentes={alumnosDelGrupo.filter(n => asistencias[n.nombre] === 'Presente').length}
                    ausentes={alumnosDelGrupo.filter(n => asistencias[n.nombre] === 'Ausente').length}
                />

                <h2>Resumen del {fecha}</h2>
                <ul>
                    {Object.entries(asistencias).map(([nombre, estado]) => (
                        <li key={nombre}>{nombre}: {estado}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
