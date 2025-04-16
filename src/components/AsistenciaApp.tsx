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
    const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
    const [cargaMasiva, setCargaMasiva] = useState('');
    const [alumnoEditando, setAlumnoEditando] = useState<string | null>(null);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevoGrupo, setNuevoGrupo] = useState('A1');

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "alumnos"), snapshot => {
            setAlumnos(snapshot.docs.map(doc => doc.data() as { nombre: string, grupo: string }));
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const cargarAsistencias = async () => {
            const snapshot = await getDocs(collection(db, "asistencias"));
            const asistenciasDelDia: Record<string, string> = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.fecha === fecha) asistenciasDelDia[data.alumno] = data.estado;
            });
            setAsistencias(asistenciasDelDia);
            setTimeout(() => setLoading(false), 800);
        };
        cargarAsistencias();
    }, [fecha]);

    const marcar = async (nombre: string, estado: string) => {
        const snapshot = await getDocs(collection(db, "asistencias"));
        const existente = snapshot.docs.find(doc => doc.data().fecha === fecha && doc.data().alumno === nombre);

        if (existente) await deleteDoc(doc(db, "asistencias", existente.id));

        await addDoc(collection(db, "asistencias"), { fecha, alumno: nombre, estado });

        setAsistencias(prev => ({ ...prev, [nombre]: estado }));
    };

    const agregarAlumno = async () => {
        const nombre = nuevoAlumno.trim();
        if (nombre && !alumnos.some(a => a.nombre === nombre)) {
            await addDoc(collection(db, "alumnos"), { nombre, grupo });
            setNuevoAlumno('');
            setMensaje(`Alumno "${nombre}" agregado al grupo "${grupo}" ✅`);
            setTimeout(() => setMensaje(''), 2500);
        }
    };

    const cargarAlumnosMasivos = async () => {
        const lineas = cargaMasiva.split('\n');
        await Promise.all(lineas.map(async linea => {
            const [nombre, grupo] = linea.split(',').map(p => p.trim());
            if (nombre && grupo && !alumnos.some(a => a.nombre === nombre)) {
                await addDoc(collection(db, "alumnos"), { nombre, grupo });
            }
        }));
        setCargaMasiva('');
        setMensaje("Carga masiva completada ✅");
        setTimeout(() => setMensaje(''), 3000);
    };

    const eliminarAlumno = async (nombre: string) => {
        const snapshot = await getDocs(collection(db, "alumnos"));
        const docToDelete = snapshot.docs.find(doc => doc.data().nombre === nombre);
        if (docToDelete) await deleteDoc(doc(db, "alumnos", docToDelete.id));
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
        signOut(auth).then(() => setIsAuthenticated(false)).catch(console.error);
    };

    if (loading) return <div className="login-container"><p>Cargando datos... ⏳</p></div>;

    if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

    const alumnosDelGrupo = alumnos.filter(a => a.grupo === grupoSeleccionado);

    const generarCSV = () => {
        const csv = ['Nombre,Estado'];
        alumnosDelGrupo.forEach(({ nombre }) => {
            csv.push(`${nombre},${asistencias[nombre] || 'Sin marcar'}`);
        });
        const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `asistencia-${fecha}.csv`;
        link.click();
    };

    return (
        <div className="app-container">
            <div className="header">
                <h1>Asistencia - C&E English</h1>
                <button onClick={handleLogout}>Cerrar sesión</button>
            </div>

            <div className="fecha-input">
                <label>
                    Fecha:
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </label>
            </div>

            <div className="filtros-grupo">
                <label>
                    Filtrar nivel:
                    <select value={grupoSeleccionado} onChange={(e) => setGrupoSeleccionado(e.target.value)}>
                        {["A1", "A2", "B1", "B2", "C1", "C2"].map(nivel => (
                            <option key={nivel} value={nivel}>{nivel}</option>
                        ))}
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
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map(nivel => (
                        <option key={nivel} value={nivel}>{nivel}</option>
                    ))}
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
                {["Presente", "Ausente", "Sin marcar"].map(estado => (
                    <div key={estado}>
                        <h3>
                            {estado === "Presente" && `✅ Presentes (${alumnosDelGrupo.filter(n => asistencias[n.nombre] === 'Presente').length})`}
                            {estado === "Ausente" && `❌ Ausentes (${alumnosDelGrupo.filter(n => asistencias[n.nombre] === 'Ausente').length})`}
                            {estado === "Sin marcar" && `🟡 Sin marcar (${alumnosDelGrupo.filter(n => !asistencias[n.nombre]).length})`}
                        </h3>
                        <ul className="lista-alumnos">
                            {alumnosDelGrupo
                                .filter(n => estado === "Sin marcar" ? !asistencias[n.nombre] : asistencias[n.nombre] === estado)
                                .map(({ nombre, grupo }) => (
                                    <li key={nombre} className="alumno-item">
                                        <strong>{nombre}</strong>
                                        <div className="botones-asistencia">
                                            <button className={estado === "Presente" ? "presente activo" : "presente"} onClick={() => marcar(nombre, 'Presente')}>Presente</button>
                                            <button className={estado === "Ausente" ? "ausente activo" : "ausente"} onClick={() => marcar(nombre, 'Ausente')}>Ausente</button>
                                            <button className="eliminar" onClick={() => eliminarAlumno(nombre)}>Eliminar</button>
                                            {alumnoEditando === nombre && (
                                                <div className="editar-form">
                                                    <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
                                                    <select value={nuevoGrupo} onChange={(e) => setNuevoGrupo(e.target.value)}>
                                                        {["A1", "A2", "B1", "B2", "C1", "C2"].map(nivel => (
                                                            <option key={nivel} value={nivel}>{nivel}</option>
                                                        ))}
                                                    </select>
                                                    <button onClick={editarAlumno}>Guardar</button>
                                                </div>
                                            )}
                                            <button onClick={() => { setAlumnoEditando(nombre); setNuevoNombre(nombre); setNuevoGrupo(grupo); }}>✏️</button>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    </div>
                ))}
            </div>

            <button
                style={{ marginBottom: '20px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#1976d2', color: 'white', border: 'none' }}
                onClick={generarCSV}
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
